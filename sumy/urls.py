from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # API routes
    path("api/", include([
        path("accounts/", include("accounts.urls")),
        path("v1/", include("mainapp.urls")),  # Versioned API
        path("noticeboard/", include("noticeboard.urls")),
        path("news/", include("news.urls")),
    ])),

    path('api/map/', include('map.urls')),

    # Legacy (non-versioned) API and root paths
    path("", include("mainapp.urls")),
]
# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
