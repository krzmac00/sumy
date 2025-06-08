from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # API routes
    path("api/", include([
        path("accounts/", include("accounts.urls")),
        path("v1/", include("mainapp.urls")),  # Versioned API
    ])),

    path('api/map/', include('map.urls')),

    # Legacy (non-versioned) API and root paths
    path("", include("mainapp.urls")),
]