from django import forms
from .models import Wydarzenie

class WydarzenieForm(forms.ModelForm):
    class Meta:
        model = Wydarzenie
        fields = '__all__'
        widgets = {
            'godzina_rozpoczecia': forms.TimeInput(attrs={'type': 'time'}),
            'data_rozpoczecia': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'godzina_zakonczenia': forms.TimeInput(attrs={'type': 'time'}),
            'data_zakonczenia': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'tytuł': forms.Textarea(attrs={'rows': 3}),
        }
