from django.urls import path
from . import views


app_name = 'graphics'

urlpatterns = [
    path('', views.homepage, name='home'),
    path('labs/<int:lab_number>', views.labs, name='labs'),
]