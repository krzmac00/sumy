from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import re

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['login', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, attrs):
        # Validate password match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate university email
        email = attrs['email']
        if not email.endswith('@edu.p.lodz.pl'):
            raise serializers.ValidationError({"email": "Only university emails ending with @edu.p.lodz.pl are allowed."})
        
        # Validate username format based on email
        username_part = email.split('@')[0]
        
        # Check if it's a student (numeric ID) or lecturer (name.surname)
        if not (username_part.isdigit() or re.match(r'^[A-Za-z]+\.[A-Za-z]+$', username_part)):
            raise serializers.ValidationError({
                "email": "Email format must be either a numeric ID (for students) or firstname.lastname (for lecturers)."
            })
            
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs