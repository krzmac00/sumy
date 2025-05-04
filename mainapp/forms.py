from django import forms
from .models import Event

# class EventForm(forms.ModelForm):
#     class Meta:
#         model = Event
#         fields = '__all__'
#         widgets = {
#             'start_time': forms.TimeInput(attrs={'type': 'time'}),
#             'start_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
#             'end_time': forms.TimeInput(attrs={'type': 'time'}),
#             'end_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
#             'title': forms.Textarea(attrs={'rows': 3}),
#         }


class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = '__all__'
        widgets = {
            'time': forms.TimeInput(attrs={'type': 'time'}),
            'date': forms.DateInput(attrs={'type': 'date'}),
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'rows': 3}),
        }