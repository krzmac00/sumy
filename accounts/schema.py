from rest_framework.schemas import AutoSchema
import coreapi
import coreschema

class AuthenticationSchema(AutoSchema):
    def get_manual_fields(self, path, method):
        extra_fields = []
        if method.lower() == 'post':
            if '/register/' in path:
                extra_fields = [
                    coreapi.Field(
                        name='email',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='University email ending with @edu.p.lodz.pl'
                        )
                    ),
                    coreapi.Field(
                        name='password',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Password'
                        )
                    ),
                    coreapi.Field(
                        name='password2',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Confirm password'
                        )
                    ),
                    coreapi.Field(
                        name='first_name',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='First name'
                        )
                    ),
                    coreapi.Field(
                        name='last_name',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Last name'
                        )
                    )
                ]
            elif '/token/' in path:
                extra_fields = [
                    coreapi.Field(
                        name='email',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Email address'
                        )
                    ),
                    coreapi.Field(
                        name='password',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Password'
                        )
                    )
                ]
            elif '/token/refresh/' in path:
                extra_fields = [
                    coreapi.Field(
                        name='refresh',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Refresh token'
                        )
                    )
                ]
            elif '/logout/' in path:
                extra_fields = [
                    coreapi.Field(
                        name='refresh_token',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Refresh token to blacklist'
                        )
                    )
                ]
            elif '/change-password/' in path:
                extra_fields = [
                    coreapi.Field(
                        name='old_password',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Current password'
                        )
                    ),
                    coreapi.Field(
                        name='new_password',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='New password'
                        )
                    ),
                    coreapi.Field(
                        name='new_password2',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='Confirm new password'
                        )
                    )
                ]
            elif '/change-role/' in path:
                extra_fields = [
                    coreapi.Field(
                        name='role',
                        location='form',
                        required=True,
                        schema=coreschema.String(
                            description='New role (student, lecturer, admin)'
                        )
                    )
                ]
        return self._manual_fields + extra_fields