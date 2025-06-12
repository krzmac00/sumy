from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import re

from accounts.models import UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    blacklist = serializers.CharField(required=False)
    bio = serializers.CharField(source='profile.bio', allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'login', 'email', 'first_name', 'last_name', 'role', 'blacklist', 'bio']
        read_only_fields = ['login', 'role']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user != instance:
            rep.pop('blacklist', None)
        else:
            rep['blacklist'] = instance.blacklist or []
        return rep

    def validate_blacklist(self, value):
        if not value:
            return []
        matches = re.findall(r'"(.*?)"', value)
        return matches

    def update(self, instance, validated_data):
        bio = validated_data.pop('profile', {}).get('bio', None)

        request = self.context.get('request')
        if request and request.user != instance:
            validated_data.pop('blacklist', None)
        else:
            blacklist = validated_data.get('blacklist')
            if isinstance(blacklist, str):
                validated_data['blacklist'] = self.validate_blacklist(blacklist)

        user = super().update(instance, validated_data)

        # zapis bio w modelu UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if bio is not None:
            profile.bio = bio
            profile.save()

        return user

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
        username_part = email.split('@')[0]
        
        if email.endswith('@edu.p.lodz.pl'):
            # Student email validation
            if not username_part.isdigit():
                raise serializers.ValidationError({
                    "email": "Student emails must use numeric ID format: 123456@edu.p.lodz.pl"
                })
        elif email.endswith('@p.lodz.pl'):
            # Lecturer email validation
            if not re.match(r'^[A-Za-z]+\.[A-Za-z]+$', username_part):
                raise serializers.ValidationError({
                    "email": "Lecturer emails must use firstname.lastname format: firstname.lastname@p.lodz.pl"
                })
        else:
            raise serializers.ValidationError({
                "email": "Only university emails are allowed. Students: 123456@edu.p.lodz.pl, Lecturers: firstname.lastname@p.lodz.pl"
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

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio']

class UserSearchSerializer(serializers.ModelSerializer):
    index_number = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'index_number']

    def get_index_number(self, obj):
        # wyciągamy pierwsze 6 cyfr z emaila
        return obj.email.split('@')[0]