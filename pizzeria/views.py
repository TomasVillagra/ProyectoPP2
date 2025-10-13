from django.shortcuts import render
from django.http import JsonResponse
def ping(request):
    return JsonResponse({"ok": True, "message": "API Pizzería OK"})

# Create your views here.
