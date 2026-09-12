from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from .models import ChatConversation, ChatMessage
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q

from .serializers import (
    ChatConversationCreateSerializer,
    ChatConversationSerializer,
    ChatMessageSerializer,
)

from rest_framework.generics import (
    RetrieveUpdateDestroyAPIView,
    RetrieveUpdateAPIView,
    ListCreateAPIView,
)

# Create your views here.


class ChatConversationListCreateView(ListCreateAPIView):
    """List conversations for current user or create a new conversation"""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatConversationCreateSerializer
        return ChatConversationSerializer

    def get_queryset(self):
        user = self.request.user
        # Return conversations where user is either participant1 or participant2
        return ChatConversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).select_related(
            "participant1", "participant2", "related_spare_part", "related_hire_request"
        )

    def perform_create(self, serializer):
        # For now, allow any authenticated user to create conversations
        # We'll handle conversation type logic in the serializer
        serializer.save()


class ChatConversationDetailView(RetrieveUpdateAPIView):
    """Retrieve or update a specific conversation"""

    queryset = ChatConversation.objects.all()
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        # Check if user is part of this conversation
        if user != obj.buyer and user != obj.seller:
            raise PermissionDenied("You are not part of this conversation")

        return obj


class ChatMessageListCreateView(ListCreateAPIView):
    """List messages in a conversation or create a new message"""

    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]
        conversation = get_object_or_404(ChatConversation, id=conversation_id)

        # Check if user is part of this conversation
        if self.request.user not in [
            conversation.participant1,
            conversation.participant2,
        ]:
            raise PermissionDenied("You are not part of this conversation")

        return ChatMessage.objects.filter(
            conversation=conversation, is_deleted=False
        ).select_related("sender")

    def perform_create(self, serializer):
        conversation_id = self.kwargs["conversation_id"]
        conversation = get_object_or_404(ChatConversation, id=conversation_id)

        # Check if user is part of this conversation
        if self.request.user not in [
            conversation.participant1,
            conversation.participant2,
        ]:
            raise PermissionDenied("You are not part of this conversation")

        # Check if conversation is active
        if conversation.status != "ACTIVE":
            raise ValidationError("Cannot send messages to inactive conversations")

        serializer.save(conversation=conversation, sender=self.request.user)


class MarkMessagesAsReadView(APIView):
    """Mark messages as read for the current user in a conversation"""

    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(ChatConversation, id=conversation_id)
        user = request.user

        # Check if user is part of this conversation
        if user not in [conversation.buyer, conversation.seller]:
            raise PermissionDenied("You are not part of this conversation")

        # Update last read timestamp
        now = timezone.now()
        if user == conversation.buyer:
            conversation.buyer_last_read_at = now
            # Mark all seller's messages as read by buyer
            ChatMessage.objects.filter(
                conversation=conversation,
                sender=conversation.seller,
                read_by_buyer=False,
            ).update(read_by_buyer=True)
        else:
            conversation.seller_last_read_at = now
            # Mark all buyer's messages as read by seller
            ChatMessage.objects.filter(
                conversation=conversation,
                sender=conversation.buyer,
                read_by_seller=False,
            ).update(read_by_seller=True)

        conversation.save(update_fields=["buyer_last_read_at", "seller_last_read_at"])

        return Response({"status": "Messages marked as read"})


class ChatMessageDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific message"""

    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.select_related("sender", "conversation")

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        # Check if user is part of this conversation
        if user not in [obj.conversation.buyer, obj.conversation.seller]:
            raise PermissionDenied("You are not part of this conversation")

        return obj

    def perform_update(self, serializer):
        # Only message sender can edit their own messages
        if self.get_object().sender != self.request.user:
            raise PermissionDenied("You can only edit your own messages")

        serializer.save(is_edited=True)

    def perform_destroy(self, instance):
        # Only message sender can delete their own messages
        if instance.sender != self.request.user:
            raise PermissionDenied("You can only delete your own messages")

        # Soft delete - mark as deleted instead of actually deleting
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])
