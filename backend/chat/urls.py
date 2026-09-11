from django.urls import path

from .views import (
    ChatConversationListCreateView,
    ChatConversationDetailView,
    ChatMessageListCreateView,
    MarkMessagesAsReadView,
    ChatMessageDetailView,
)

# app urls

urlpatterns = [
    path(
        "chat/conversations/",
        ChatConversationListCreateView.as_view(),
        name="chat_conversation_list_create",
    ),
    path(
        "chat/conversations/<int:pk>/",
        ChatConversationDetailView.as_view(),
        name="chat_conversation_detail",
    ),
    path(
        "chat/conversations/<int:conversation_id>/messages/",
        ChatMessageListCreateView.as_view(),
        name="chat_message_list_create",
    ),
    path(
        "chat/conversations/<int:conversation_id>/mark-read/",
        MarkMessagesAsReadView.as_view(),
        name="chat_mark_read",
    ),
    path(
        "chat/messages/<int:pk>/",
        ChatMessageDetailView.as_view(),
        name="chat_message_detail",
    ),
]
