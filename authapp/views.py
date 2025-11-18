# authapp/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token

@ensure_csrf_cookie
def csrf(request):
    # Devuelve cookie csrftoken y TAMBIÉN el token en el body
    return JsonResponse({'detail': 'CSRF cookie set', 'csrfToken': get_token(request)})

@require_POST
@csrf_protect
def login_view(request):
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'detail': 'JSON inválido'}, status=400)

    username = body.get('username') or ''
    password = body.get('password') or ''

    user = authenticate(request, username=username, password=password)
    if user is None or not user.is_active:
        return JsonResponse({'detail': 'Credenciales inválidas'}, status=400)

    login(request, user)
    return JsonResponse({'detail': 'ok'})

@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({'detail': 'ok'})

def me(request):
    if request.user.is_authenticated:
        return JsonResponse({'is_authenticated': True, 'username': request.user.username})
    return JsonResponse({'is_authenticated': False})


