from .models import ChatMessage, ChatConversation, User

from rest_framework.serializers import (
    SerializerMethodField,
    ModelSerializer,
    IntegerField,
    CharField,
)

# app serializers


class ChatMessageSerializer(ModelSerializer):
    "Serializer for chat messages"

    sender_username = CharField(source="sender.username", read_only=True)
    sender_name = CharField(source="sender.name", read_only=True)
    is_mine = SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "sender_name",
            "message_type",
            "content",
            "image",
            "file",
            "is_edited",
            "is_deleted",
            "read_by_buyer",
            "read_by_seller",
            "is_read_by_recipient",
            "is_mine",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "sender": {"read_only": True},
            "conversation": {"read_only": True},
            "is_edited": {"read_only": True},
            "read_by_buyer": {"read_only": True},
            "read_by_seller": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }

    def get_is_mine(self, obj):
        "Check if the message belongs to the current user"
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False


class ChatConversationSerializer(ModelSerializer):
    "Serializer for chat conversations"

    participant1_details = SerializerMethodField()
    participant2_details = SerializerMethodField()
    other_participant = SerializerMethodField()
    related_spare_part_name = CharField(
        source="related_spare_part.name", read_only=True
    )
    last_message = SerializerMethodField()
    unread_count = SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = [
            "id",
            "participant1_details",
            "participant2_details",
            "other_participant",
            "conversation_type",
            "related_spare_part",
            "related_spare_part_name",
            "related_hire_request",
            "status",
            "last_message_at",
            "last_message",
            "unread_count",
            "participant1_last_read_at",
            "participant2_last_read_at",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "last_message_at": {"read_only": True},
            "participant1_last_read_at": {"read_only": True},
            "participant2_last_read_at": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }

    def get_participant1_details(self, obj):
        "Get participant1 details"
        if obj.participant1:
            return {
                "id": obj.participant1.id,
                "username": obj.participant1.username,
                "name": obj.participant1.name,
                "role": obj.participant1.role,
            }
        return None

    def get_participant2_details(self, obj):
        "Get participant2 details"
        if obj.participant2:
            return {
                "id": obj.participant2.id,
                "username": obj.participant2.username,
                "name": obj.participant2.name,
                "role": obj.participant2.role,
            }
        return None

    def get_other_participant(self, obj):
        "Get the other participant for the current user"
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    "id": other_user.id,
                    "username": other_user.username,
                    "name": other_user.name,
                    "role": other_user.role,
                }
        return None

    def get_last_message(self, obj):
        "Get the last message in the conversation"
        last_message = obj.messages.filter(is_deleted=False).last()
        if last_message:
            return {
                "id": last_message.id,
                "content": last_message.content,
                "sender_username": last_message.sender.username,
                "message_type": last_message.message_type,
                "created_at": last_message.created_at,
            }
        return None

    def get_unread_count(self, obj):
        "Get unread message count for the current user"
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.get_unread_count_for_user(request.user)
        return 0


class ChatConversationCreateSerializer(ModelSerializer):
    "Serializer for creating new chat conversations"

    seller = IntegerField(write_only=True)

    class Meta:
        model = ChatConversation
        fields = ["seller", "related_spare_part", "related_hire_request"]

    def create(self, validated_data):
        # Get seller from validated data
        seller_id = validated_data.pop("seller")
        seller = User.objects.get(id=seller_id)

        # Set participants
        current_user = self.context["request"].user

        # Determine conversation type based on participants
        if current_user.role == "BUYER" and seller.role == "SELLER":
            conversation_type = ChatConversation.ConversationType.BUYER_SELLER
        elif current_user.role in ["BUYER", "SELLER"] and seller.role == "MECHANIC":
            conversation_type = ChatConversation.ConversationType.CUSTOMER_MECHANIC
        else:
            conversation_type = ChatConversation.ConversationType.GENERAL

        # Create conversation with participants
        conversation = ChatConversation.objects.create(
            participant1=current_user,
            participant2=seller,
            conversation_type=conversation_type,
            **validated_data
        )

        return conversation
