from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        """
        Overridden execution block that imports signals on application startup.
        This ensures both our Lease lifecycle listeners and Maintenance Vendor
        dispatch listeners are registered and actively listening to model events.
        """
        # ✅ Automatically hooks up your entire consolidated automation ecosystem on server boot
        import notifications.signals