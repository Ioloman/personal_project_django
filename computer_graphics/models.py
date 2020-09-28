from django.db import models


class Lab(models.Model):
    number = models.IntegerField()
    description = models.CharField(max_length=150)
    image = models.ImageField(upload_to='computer_graphics/images')

    def __str__(self):
        return str(self.number)
