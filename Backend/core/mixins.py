class RoleScopedQuerySetMixin:
    """
    Mixin to override get_queryset based on user role and property assignments.
    Expects the viewset to define `property_lookup_kwarg` which is the ORM path 
    from the current model to the Property model. 
    Default is 'property' (e.g. for Units, Leases).
    For Properties themselves, it would be '' (empty string).
    """
    property_lookup_kwarg = 'property'

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if not user.is_authenticated:
            return qs.none()

        if user.role == 'ADMIN':
            return qs
        
        if user.role == 'OWNER':
            lookup = f"{self.property_lookup_kwarg}__owner" if self.property_lookup_kwarg else "owner"
            return qs.filter(**{lookup: user})
            
        if user.role in ['MANAGER', 'CARETAKER']:
            assigned_properties = user.property_assignments.values_list('property_id', flat=True)
            lookup = f"{self.property_lookup_kwarg}__id__in" if self.property_lookup_kwarg else "id__in"
            return qs.filter(**{lookup: assigned_properties})

        # By default, this mixin hides data from TENANT/GUEST roles.
        # Models that need tenant access should explicitly handle tenant logic in get_queryset.
        return qs.none()
