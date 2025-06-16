from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.author == request.user


class IsCommentOwnerOrAdvertisementOwner(permissions.BasePermission):
    """
    Custom permission for comments:
    - Anyone can create a comment (if authenticated)
    - Only comment author can edit/delete
    - Advertisement owner can see all comments on their advertisement
    """
    def has_permission(self, request, view):
        # Must be authenticated to interact with comments
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # For viewing comments
        if request.method in permissions.SAFE_METHODS:
            # Comment author can always see their own comment
            if obj.author == request.user:
                return True
            
            # Advertisement owner can see all comments
            if obj.advertisement.author == request.user:
                return True
            
            # Others can only see public comments
            return obj.is_public
        
        # For editing/deleting comments
        return obj.author == request.user