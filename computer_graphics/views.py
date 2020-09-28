from django.shortcuts import render


def homepage(request):
    if request.method == 'GET':
        return render(request, '../templates/computer_graphics/homepage.html')


def labs(request, lab_number):
    if request.method == 'GET':
        return render(request, '../templates/computer_graphics/{}.html'.format(lab_number), {'number': lab_number})
