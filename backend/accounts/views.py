import json
import time
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from django_ratelimit.decorators import ratelimit


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})


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

    # Store the last activity time in the server-side session.
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

    # End the session after 10 minutes of inactivity.
    if last_activity is None or now - last_activity >= 600:
        logout(request)
        return JsonResponse(
            {"message": "Your session has expired. Please login again."},
            status=401,
        )

    # Refresh the inactivity timer after a valid dashboard request.
    request.session["last_activity"] = now
    request.session.set_expiry(600)

    return JsonResponse({
        "email": request.user.email,
        "message": "Dashboard access successful",
        "session_timeout_seconds": 600,
    })


@require_POST
def logout_view(request):
    logout(request)
    response = JsonResponse({
        "message": "Logged out successfully",
    })
    response.delete_cookie("sessionid")
    return response
