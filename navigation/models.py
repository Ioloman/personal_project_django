from django.db import models


class MyProject(models.Model):
    title = models.CharField(max_length=50)
    urls_name = models.CharField(max_length=100)
    description = models.CharField(blank=True, max_length=150)
    image = models.ImageField(upload_to='navigation/images', blank=True)

    def __str__(self):
        return self.title
