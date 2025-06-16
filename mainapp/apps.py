from django.apps import AppConfig


class MyappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mainapp'
    
    def ready(self):
        # Import signals to register them
        import mainapp.signals
