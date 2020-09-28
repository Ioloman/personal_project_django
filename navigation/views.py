from django.shortcuts import render
from .models import MyProject


def homepage(request):
    if request.method == 'GET':
        return render(request, '../templates/navigation/homepage.html', {'projects': MyProject.objects.all()})