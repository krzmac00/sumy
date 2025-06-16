from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from mainapp.post import Thread, PinnedThread
from mainapp.serializers import PinnedThreadSerializer, PinThreadSerializer


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def pin_thread(request):
    """Pin or unpin a thread for the authenticated user."""
    serializer = PinThreadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    thread_id = serializer.validated_data['thread_id']
    thread = get_object_or_404(Thread, id=thread_id)
    
    # Check if already pinned
    try:
        pinned = PinnedThread.objects.get(user=request.user, thread=thread)
        # If already pinned, unpin it
        pinned.delete()
        return Response({'status': 'unpinned', 'message': 'Thread unpinned successfully'})
    except PinnedThread.DoesNotExist:
        # Pin the thread
        try:
            pinned = PinnedThread.objects.create(user=request.user, thread=thread)
            serializer = PinnedThreadSerializer(pinned)
            return Response({
                'status': 'pinned',
                'message': 'Thread pinned successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {'error': 'Thread is already pinned'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pinned_threads(request):
    """Get all pinned threads for the authenticated user with unread counts."""
    pinned_threads = PinnedThread.objects.filter(user=request.user).select_related('thread')
    serializer = PinnedThreadSerializer(pinned_threads, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_thread_as_viewed(request, thread_id):
    """Mark a pinned thread as viewed, updating the last_viewed timestamp."""
    try:
        pinned = PinnedThread.objects.get(user=request.user, thread_id=thread_id)
        pinned.mark_as_viewed()
        return Response({'message': 'Thread marked as viewed'})
    except PinnedThread.DoesNotExist:
        return Response(
            {'error': 'Thread is not pinned'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pin_status(request, thread_id):
    """Check if a thread is pinned by the authenticated user."""
    is_pinned = PinnedThread.objects.filter(
        user=request.user,
        thread_id=thread_id
    ).exists()
    
    return Response({'is_pinned': is_pinned})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def get_bulk_pin_status(request):
    """Check pin status for multiple threads at once."""
    thread_ids = request.data.get('thread_ids', [])
    
    if not thread_ids:
        return Response({'error': 'No thread IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get all pinned thread IDs for the user
    pinned_thread_ids = set(
        PinnedThread.objects.filter(
            user=request.user,
            thread_id__in=thread_ids
        ).values_list('thread_id', flat=True)
    )
    
    # Create response mapping thread_id to pin status
    pin_statuses = {
        thread_id: thread_id in pinned_thread_ids
        for thread_id in thread_ids
    }
    
    return Response({'pin_statuses': pin_statuses})