from .models import Lab


def labs_processor(request):
    return {'labs': Lab.objects.all()}