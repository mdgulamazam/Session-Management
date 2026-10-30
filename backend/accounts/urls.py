from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf, name="csrf"),
    path("register/", views.register_view, name="register"),
    path("login/", views.login_view, name="login"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("logout/", views.logout_view, name="logout"),
    path("activity/", views.activity_view, name="activity"),
]