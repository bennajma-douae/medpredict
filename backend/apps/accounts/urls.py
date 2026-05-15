from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
# Le router va créer automatiquement les routes pour :
# - /api/users/ (GET, POST)
# - /api/users/me/ (GET)
# - /api/users/activate/<uidb64>/<token>/ (GET, POST)
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]