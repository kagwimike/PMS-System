from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        """
        Overridden execution block that imports signals on application startup.
        This ensures our Lease lifecycle listeners are actively listening to model events.
        """
        import notifications.signals