from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')   # basename ajouté (bonne pratique)

urlpatterns = [
    path('', include(router.urls)),
    
    # Route personnalisée pour la vérification d'email
    # Elle sera accessible via : /api/users/verify-email/<uid>/<token>/
    path('verify-email/<str:uidb64>/<str:token>/', 
         UserViewSet.as_view({'get': 'verify_email'}), 
         name='verify-email'),
]