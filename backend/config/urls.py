from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from apps.accounts.views import CabinetConfigViewSet, EmailTemplateViewSet


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # On branche chaque application sur son préfixe
    path('api/users/', include('apps.accounts.urls')),
    path('api/patients/', include('apps.patients.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/consultations/', include('apps.consultations.urls')),
    path('api/prescriptions/', include('apps.prescriptions.urls')),
    path('api/chat/', include('apps.chat.urls')),
    
    # Configuration globale et Templates d'Emails
    path('api/config/cabinet/', CabinetConfigViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('api/config/templates/', EmailTemplateViewSet.as_view({'get': 'list'})),
    path('api/config/templates/<str:key>/', EmailTemplateViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'update'})),
    
    # Authentification JWT (C'est ce que ton Frontend utilise pour le Login)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]