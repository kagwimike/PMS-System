from django.contrib import admin
from .models import Property, Amenity, PropertyImage, PropertyPricing


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


class PropertyPricingInline(admin.StackedInline):
    model = PropertyPricing
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("name", "property_type", "status", "owner", "city")
    list_filter = ("property_type", "status", "city")
    search_fields = ("name", "city")

    inlines = [PropertyImageInline, PropertyPricingInline]


admin.site.register(Amenity)
