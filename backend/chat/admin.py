from .models import ChatConversation, ChatMessage, _
from django.contrib import admin

# Register your models here.


class ChatMessageInline(admin.TabularInline):
    """Inline admin for chat messages"""

    model = ChatMessage
    extra = 0
    readonly_fields = ("created_at", "updated_at", "is_read_by_recipient")
    fields = (
        "sender",
        "message_type",
        "content",
        "is_edited",
        "is_deleted",
        "created_at",
    )


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    """Admin configuration for ChatConversation model"""

    list_display = (
        "buyer",
        "seller",
        "related_spare_part",
        "status",
        "last_message_at",
        "created_at",
    )
    list_filter = ("status", "created_at", "last_message_at")
    search_fields = ("buyer__username", "seller__username", "related_spare_part__name")
    readonly_fields = (
        "created_at",
        "updated_at",
        "last_message_at",
        "unread_count_for_buyer",
        "unread_count_for_seller",
    )
    inlines = [ChatMessageInline]

    fieldsets = (
        (_("Participants"), {"fields": ("buyer", "seller", "related_spare_part")}),
        (_("Status"), {"fields": ("status",)}),
        (
            _("Activity Tracking"),
            {
                "fields": (
                    "last_message_at",
                    "buyer_last_read_at",
                    "seller_last_read_at",
                )
            },
        ),
        (
            _("Unread Counts"),
            {"fields": ("unread_count_for_buyer", "unread_count_for_seller")},
        ),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin configuration for ChatMessage model"""

    list_display = (
        "conversation",
        "sender",
        "message_type",
        "content_preview",
        "is_read_by_recipient",
        "created_at",
    )
    list_filter = ("message_type", "is_edited", "is_deleted", "created_at")
    search_fields = ("sender__username", "content")
    readonly_fields = ("created_at", "updated_at", "is_read_by_recipient")

    fieldsets = (
        (
            _("Message Details"),
            {"fields": ("conversation", "sender", "message_type", "content")},
        ),
        (_("Attachments"), {"fields": ("image", "file")}),
        (
            _("Status"),
            {"fields": ("is_edited", "is_deleted", "read_by_buyer", "read_by_seller")},
        ),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )

    def content_preview(self, obj):
        """Show a preview of the message content"""
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = _("Content Preview")
