from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from units.models import Unit

User = settings.AUTH_USER_MODEL

LEASE_STATUS = (
    ("PENDING", "Pending Payment"),
    ("ACTIVE", "Active"),
    ("TERMINATED", "Terminated"),
)

class Lease(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="leases")
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leases")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=LEASE_STATUS, default="PENDING")
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    def clean(self):
        """
        Put validation logic in clean() instead of save(). 
        This allows Django REST Framework serializers to catch errors 
        and return a clean '400 Bad Request' response to React.
        """
        super().clean()
        print(f"⚙️ [MODEL CLEAN] Running date checks for Unit {self.unit} | Status: {self.status}")
        
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({"start_date": "Start date cannot be after end date."})

        # Check overlapping active/pending leases safely
        if self.status in ["ACTIVE", "PENDING"]:
            overlapping = Lease.objects.filter(
                unit=self.unit,
                status__in=["ACTIVE", "PENDING"],
                start_date__lte=self.end_date,
                end_date__gte=self.start_date
            ).exclude(pk=self.pk)

            if overlapping.exists():
                raise ValidationError("This unit already has an active or pending lease scheduled for these dates.")

    def save(self, *args, **kwargs):
        print("\n--- 🪵 [MODEL SAVE METHOD EXECUTION START] ---")
        
        # 1. Run the clean validation checks before saving
        self.full_clean()

        # 2. Auto-fill rent from Unit if left blank by Landlord
        if not self.rent_amount and self.unit and hasattr(self.unit, 'rent_price'):
            self.rent_amount = self.unit.rent_price
            print(f"💵 Rent amount empty. Auto-extracted fallback value from Unit: KSh {self.rent_amount}")

        # Track if this is a brand new lease creation entry
        is_new_lease = self.pk is None
        print(f"🔍 Pipeline State: is_new={is_new_lease} | current_status='{self.status}'")

        # 3. Save the Lease instance first
        super().save(*args, **kwargs)
        print(f"💾 Primary Lease ID #{self.id} committed securely to database row storage.")

        # 4. Trigger Instant STK Onboarding Invoice for brand new pending leases
        if is_new_lease and self.status == "PENDING":
            print("🚀 Conditions matched. Launching inner trigger_onboarding_invoice workflow...")
            self.trigger_onboarding_invoice()
        else:
            print(f"⏭️ Skipping onboarding triggers. Status is '{self.status}' (Must be PENDING and brand new).")

        # 5. Unit Status Management based on the paid/active state
        if self.status == "ACTIVE":
            if self.unit.status != "OCCUPIED":
                self.unit.status = "OCCUPIED"
                self.unit.save(update_fields=["status"])
                print(f"🏢 Unit {self.unit.unit_number} status updated to -> OCCUPIED")
        else:
            # If status remains PENDING or TERMINATED, keep the unit VACANT
            if self.unit.status != "VACANT":
                self.unit.status = "VACANT"
                self.unit.save(update_fields=["status"])
                print(f"🏢 Unit {self.unit.unit_number} status managed as -> VACANT")

        print("--- 🪵 [MODEL SAVE METHOD EXECUTION END] ---\n")

    def trigger_onboarding_invoice(self):
        """
        Automated financial generation block. 
        Imports models locally inside the function to prevent circular import loops.
        """
        from payments.models import Invoice, Payment
        from payments.mpesa import initiate_stk_push
        
        print("\n--- ⚡ [MODEL INTERNALS - FINANCIAL TRIGGER ACTIVE] ---")

        # Calculate exact onboarding amount (Rent + optional Deposit)
        rent = self.rent_amount or 0
        deposit = self.deposit_amount or 0
        total_onboarding_fee = rent + deposit
        print(f"💰 Accounting Calculations -> Rent: {rent}, Deposit: {deposit} | Total Due: KSh {total_onboarding_fee}")

        if total_onboarding_fee <= 0:
            print(f"⚠️ Lease #{self.id} generated with 0 balance due. STK execution skipped.")
            print("--- ⚡ [MODEL INTERNALS - FINANCIAL TRIGGER COMPLETED] ---\n")
            return

        # FIXED COLUMN ACCESS TO MATCH YOUR SCHEMAS (Uses exact field: 'phone')
        phone_raw = getattr(self.tenant, 'phone', None)
        print(f"📱 Extracted user profile handset data token: '{phone_raw}'")
        
        if not phone_raw:
            print(f"❌ STK Automation Failed: Tenant user model column 'phone' returned empty string or None.")
            print("--- ⚡ [MODEL INTERNALS - FINANCIAL TRIGGER COMPLETED] ---\n")
            return

        # 🔄 SAFARICOM DARAJA RE-FORMATTING ENGINE
        cleaned_phone = str(phone_raw).strip().replace("+", "")
        if cleaned_phone.startswith("0"):
            cleaned_phone = "254" + cleaned_phone[1:]
        elif cleaned_phone.startswith("7") or cleaned_phone.startswith("1"):
            cleaned_phone = "254" + cleaned_phone
            
        print(f"⚙️ Formatted Request Routing Parameter Header: '{cleaned_phone}'")

        # Create the initial onboarding Invoice document
        # 🛠️ SYSTEM FIXES applied here to match database schemas:
        # 1. Removed 'balance_due' field assignment since it's a read-only @property getter
        # 2. Removed 'description' field parameter because it doesn't exist on the Invoice model table
        invoice = Invoice.objects.create(
            lease=self,
            amount=total_onboarding_fee,
            status='UNPAID',
            due_date=timezone.now().date()
        )
        print(f"📄 Auto-generated Invoice row entry built. Invoice ID: #{invoice.id}")

        # Cast payload value down to standard flat rounded Integer for Daraja runtime matching
        stk_integer_amount = int(float(total_onboarding_fee))

        try:
            print(f"📡 Dispatching outgoing packet thread directly to Safaricom API Gateway Core...")
            mpesa_res = initiate_stk_push(cleaned_phone, stk_integer_amount, invoice.id)
            print(f"🛰️ [RAW GATEWAY SERVER RESPONSE OBJECT]: {mpesa_res}")
            
            if mpesa_res and mpesa_res.get("ResponseCode") == "0":
                merchant_request_id = mpesa_res.get("MerchantRequestID")
                
                # Build the tracking trace payment ledger log row
                payment = Payment.objects.create(
                    invoice=invoice,
                    tenant=self.tenant,
                    amount=total_onboarding_fee,
                    payment_method='MPESA',
                    transaction_reference=merchant_request_id,
                    gateway_response=mpesa_res,
                    is_confirmed=False
                )
                print(f"🚀 [SUCCESS] STK Push prompt fired to user device interface! Transaction ID: #{payment.id}")
            else:
                print(f"❌ Safaricom Gateway refused configuration parameters: {mpesa_res}")
                
        except Exception as e:
            print(f"💥 Critical crash caught during gateway API dispatch: {str(e)}")
            
        print("--- ⚡ [MODEL INTERNALS - FINANCIAL TRIGGER COMPLETED] ---\n")

    def __str__(self):
        return f"{self.tenant.email} - Unit {self.unit.unit_number} ({self.status})"