from django.utils.translation import gettext_lazy as _
from mechanic.models import MechanicHireRequest
from parts.models import SparePart
from main.models import User

from django.db.models import (
    DateTimeField,
    BooleanField,
    TextChoices,
    ForeignKey,
    ImageField,
    CharField,
    TextField,
    FileField,
    SET_NULL,
    CASCADE,
    Index,
    Model,
)

# Create your models here.


class ChatConversation(Model):
    "Model for chat conversations between any two users (buyers, sellers, mechanics)"

    class Status(TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        ARCHIVED = "ARCHIVED", _("Archived")
        BLOCKED = "BLOCKED", _("Blocked")

    class ConversationType(TextChoices):
        BUYER_SELLER = "BUYER_SELLER", _("Buyer-Seller")
        CUSTOMER_MECHANIC = "CUSTOMER_MECHANIC", _("Customer-Mechanic")
        GENERAL = "GENERAL", _("General")

    # Participants (flexible for any user types)
    participant1 = ForeignKey(
        User,
        on_delete=CASCADE,
        related_name="conversations_as_participant1",
        null=True,
    )
    participant2 = ForeignKey(
        User,
        on_delete=CASCADE,
        related_name="conversations_as_participant2",
        null=True,
    )

    # Conversation type
    conversation_type = CharField(
        _("conversation type"),
        max_length=20,
        choices=ConversationType.choices,
        default=ConversationType.GENERAL,
    )

    # Related objects (optional)
    related_spare_part = ForeignKey(
        SparePart,
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
    )
    related_hire_request = ForeignKey(
        MechanicHireRequest,
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
    )

    # Conversation status
    status = CharField(
        _("status"), max_length=10, choices=Status.choices, default=Status.ACTIVE
    )

    # Last activity tracking
    last_message_at = DateTimeField(_("last message at"), null=True, blank=True)

    # Read status for participants
    participant1_last_read_at = DateTimeField(
        _("participant1 last read at"), null=True, blank=True
    )
    participant2_last_read_at = DateTimeField(
        _("participant2 last read at"), null=True, blank=True
    )

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("chat conversation")
        verbose_name_plural = _("chat conversations")
        # Prevent duplicate conversations for same participants with same related objects
        unique_together = [
            "participant1",
            "participant2",
            "related_spare_part",
            "related_hire_request",
        ]
        ordering = ["-last_message_at", "-created_at"]
        indexes = [
            Index(
                fields=[
                    "participant1",
                    "participant2",
                    "related_spare_part",
                    "related_hire_request",
                ],
                name="ucrp",
            ),
            Index(fields=["last_message_at"], name="conversation_last_message_at"),
        ]

    def __str__(self):
        related_info = ""
        if self.related_spare_part:
            related_info = f" about {self.related_spare_part.name}"
        elif self.related_hire_request:
            related_info = f" about Job #{self.related_hire_request.id}"
        return f"Conversation between {self.participant1.username} and {self.participant2.username}{related_info}"

    def get_other_participant(self, user):
        "Get the other participant in the conversation"
        if self.participant1 == user:
            return self.participant2
        elif self.participant2 == user:
            return self.participant1
        return None

    def get_unread_count_for_user(self, user):
        "Get unread message count for a specific user"
        if user == self.participant1:
            if not self.participant1_last_read_at:
                return self.messages.count()
            return self.messages.filter(
                created_at__gt=self.participant1_last_read_at, sender=self.participant2
            ).count()
        elif user == self.participant2:
            if not self.participant2_last_read_at:
                return self.messages.count()
            return self.messages.filter(
                created_at__gt=self.participant2_last_read_at, sender=self.participant1
            ).count()
        return 0

    # Backward compatibility properties
    @property
    def buyer(self):
        "Get buyer if this is a buyer-seller conversation"
        if self.conversation_type == self.ConversationType.BUYER_SELLER:
            if self.participant1.role == "BUYER":
                return self.participant1
            elif self.participant2.role == "BUYER":
                return self.participant2
        return None

    @property
    def seller(self):
        "Get seller if this is a buyer-seller conversation"
        if self.conversation_type == self.ConversationType.BUYER_SELLER:
            if self.participant1.role == "SELLER":
                return self.participant1
            elif self.participant2.role == "SELLER":
                return self.participant2
        return None

    @property
    def customer(self):
        "Get customer if this is a customer-mechanic conversation"
        if self.conversation_type == self.ConversationType.CUSTOMER_MECHANIC:
            if self.participant1.role in ["BUYER", "SELLER"]:
                return self.participant1
            elif self.participant2.role in ["BUYER", "SELLER"]:
                return self.participant2
        return None

    @property
    def mechanic(self):
        "Get mechanic if this is a customer-mechanic conversation"
        if self.conversation_type == self.ConversationType.CUSTOMER_MECHANIC:
            if self.participant1.role == "MECHANIC":
                return self.participant1
            elif self.participant2.role == "MECHANIC":
                return self.participant2
        return None

    # Backward compatibility properties for old field names
    @property
    def buyer_last_read_at(self):
        "Backward compatibility"
        buyer = self.buyer
        if buyer == self.participant1:
            return self.participant1_last_read_at
        elif buyer == self.participant2:
            return self.participant2_last_read_at
        return None

    @property
    def seller_last_read_at(self):
        "Backward compatibility"
        seller = self.seller
        if seller == self.participant1:
            return self.participant1_last_read_at
        elif seller == self.participant2:
            return self.participant2_last_read_at
        return None

    @property
    def unread_count_for_buyer(self):
        "Backward compatibility"
        buyer = self.buyer
        return self.get_unread_count_for_user(buyer) if buyer else 0

    @property
    def unread_count_for_seller(self):
        "Backward compatibility"
        seller = self.seller
        return self.get_unread_count_for_user(seller) if seller else 0


class ChatMessage(Model):
    "Model for individual chat messages"

    class MessageType(TextChoices):
        TEXT = "TEXT", _("Text Message")
        IMAGE = "IMAGE", _("Image Message")
        FILE = "FILE", _("File Message")
        SYSTEM = "SYSTEM", _("System Message")

    # Message details
    conversation = ForeignKey(
        ChatConversation, on_delete=CASCADE, related_name="messages"
    )
    sender = ForeignKey(User, on_delete=CASCADE, related_name="sent_messages")
    message_type = CharField(
        _("message type"),
        max_length=10,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )

    # Message content
    content = TextField(_("message content"))

    # File attachments (optional)
    image = ImageField(_("image"), upload_to="chat_images/", null=True, blank=True)
    file = FileField(_("file"), upload_to="chat_files/", null=True, blank=True)

    # Message status
    is_edited = BooleanField(_("edited"), default=False)
    is_deleted = BooleanField(_("deleted"), default=False)

    # Read receipts (flexible for any user types)
    read_by_participant1 = BooleanField(_("read by participant1"), default=False)
    read_by_participant2 = BooleanField(_("read by participant2"), default=False)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("chat message")
        verbose_name_plural = _("chat messages")
        ordering = ["created_at"]
        indexes = [
            Index(
                fields=["conversation", "created_at"], name="chat_message_conversation"
            ),
            Index(fields=["sender", "created_at"], name="chat_message_sender"),
        ]

    def __str__(self):
        content_preview = (
            self.content[:50] + "..." if len(self.content) > 50 else self.content
        )
        return f"Message from {self.sender.username}: {content_preview}"

    def is_read_by_user(self, user):
        "Check if message is read by a specific user"
        if user == self.conversation.participant1:
            return self.read_by_participant1
        elif user == self.conversation.participant2:
            return self.read_by_participant2
        return False

    def mark_read_by_user(self, user):
        "Mark message as read by a specific user"
        if user == self.conversation.participant1:
            self.read_by_participant1 = True
        elif user == self.conversation.participant2:
            self.read_by_participant2 = True
        self.save(update_fields=["read_by_participant1", "read_by_participant2"])

    # Backward compatibility properties
    @property
    def read_by_buyer(self):
        "Backward compatibility"
        buyer = self.conversation.buyer
        if buyer:
            return self.is_read_by_user(buyer)
        return False

    @property
    def read_by_seller(self):
        "Backward compatibility"
        seller = self.conversation.seller
        if seller:
            return self.is_read_by_user(seller)
        return False

    def save(self, *args, **kwargs):
        # Update conversation's last_message_at when a new message is created
        is_new = not self.pk

        # Save the message first to get the created_at timestamp
        super().save(*args, **kwargs)

        # Update conversation's last_message_at only for new messages
        if is_new:
            from django.utils import timezone

            self.conversation.last_message_at = self.created_at
            self.conversation.save(update_fields=["last_message_at"])

    @property
    def is_read_by_recipient(self):
        "Check if message is read by the recipient"
        other_participant = self.conversation.get_other_participant(self.sender)
        if other_participant:
            return self.is_read_by_user(other_participant)
        return False
