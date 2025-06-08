from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a post to edit or delete it.
    
    Allows:
    - Read-only access for all users (GET, HEAD, OPTIONS)
    - Write access only to the creator of an object
    - Object-level permission checks for each object in get_object
    """
    
    def has_permission(self, request, view):
        # Allow anyone to have read-only access to the API
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For write operations, require authentication in general
        # (object-level permissions will be checked for specific objects)
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the owner of the post
        # Check if the user field exists and is not None
        if hasattr(obj, 'user') and obj.user is not None:
            return obj.user == request.user
            
        # If there's no user assigned or the field doesn't exist, deny permission
        return False