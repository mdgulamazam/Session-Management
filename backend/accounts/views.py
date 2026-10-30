import json
import time
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from django_ratelimit.decorators import ratelimit
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})

@ratelimit(key="ip", rate="5/m", method="POST", block=True)

def register_view(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"message": "Invalid request data"},
            status=400,
        )

    email = data.get("email", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not email or not password or not confirm_password:
        return JsonResponse(
            {"message": "Email, password, and password confirmation are required"},
            status=400,
        )


    if password != confirm_password:
        return JsonResponse(
            {"message": "Passwords do not match"},
            status=400,
        )

    User = get_user_model()

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {"message": "An account with this email already exists"},
            status=400,
        )

    try:
        validate_password(password)
    except ValidationError as error:
        return JsonResponse(
            {"message": " ".join(error.messages)},
            status=400,
        )

    try:
        user = User.objects.create_user(
            email=email,
            password=password,
        )
    except IntegrityError:
        return JsonResponse(
            {"message": "An account with this email already exists"},
            status=400,
        )

    return JsonResponse(
        {
            "message": "Registration successful. You can now log in.",
            "email": user.email,
        },
        status=201,
    )
@ratelimit(key="ip", rate="5/m", method="POST", block=True)
@require_POST
def login_view(request):
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip()
        password = data.get("password", "")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"message": "Invalid request data"},
            status=400,
        )

    user = authenticate(
        request,
        username=email,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {"message": "Invalid email or password"},
            status=400,
        )

    if not user.is_active:
        return JsonResponse(
            {"message": "This account is inactive"},
            status=403,
        )

    login(request, user)

   
    request.session["last_activity"] = time.time()
    request.session.set_expiry(600)

    return JsonResponse({
        "message": "Login successful",
        "email": user.email,
    })


@require_GET
def dashboard(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"message": "Please login to access the dashboard"},
            status=401,
        )

    now = time.time()
    last_activity = request.session.get("last_activity")

   
    if last_activity is None or now - last_activity >= 600:
        logout(request)
        return JsonResponse(
            {"message": "Your session has expired. Please login again."},
            status=401,
        )

    

    return JsonResponse({
        "email": request.user.email,
        "message": "Dashboard access successful",
        "session_timeout_seconds": 600,
    })


@require_POST
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)

    response = JsonResponse({
        "message": "Logged out successfully"
    })

    response.delete_cookie("sessionid", path="/")
    return response



@require_POST
def activity_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "message": "Your session has expired. Please login again."
            },
            status=401,
        )

    now = time.time()
    last_activity = request.session.get("last_activity")

    if last_activity is None or now - last_activity >= 600:
        logout(request)
        response = JsonResponse(
            {
                "message": "Your session has expired. Please login again."
            },
            status=401,
        )
        response.delete_cookie("sessionid", path="/")
        return response

    request.session["last_activity"] = now
    request.session.set_expiry(600)

    return JsonResponse({"message": "Activity recorded"})

