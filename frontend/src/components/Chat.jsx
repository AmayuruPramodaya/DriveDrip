import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageCircle, 
  Image, 
  File, 
  Smile, 
  MoreVertical,
  X,
  ArrowLeft,
  Package,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChatWindow = ({ conversation, onBack, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markAsRead();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(conversation.id);
      setMessages(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await chatAPI.markAsRead(conversation.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const messageData = {
        content: newMessage.trim(),
        message_type: 'TEXT'
      };

      const response = await chatAPI.sendMessage(conversation.id, messageData);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffInHours = diff / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherUser = () => {
    if (!conversation || !user) return null;
    return conversation.other_participant || null;
  };

  const otherUser = getOtherUser();

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-200/50 rounded-full transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">
              {otherUser?.name?.charAt(0)?.toUpperCase() || otherUser?.username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-black text-lg">
              {otherUser?.name || otherUser?.username || 'Unknown User'}
            </h3>
            {conversation.related_spare_part_name && (
              <p className="text-sm text-gray-600 flex items-center">
                <Package size={14} className="mr-2 text-orange-500" />
                {conversation.related_spare_part_name}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-200/50 rounded-full transition-all duration-300 hover:scale-110"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-3xl px-6 py-3 shadow-lg backdrop-blur-sm border ${
                  message.is_mine
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-200'
                    : 'bg-white/90 text-black border-white/50'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className={`flex items-center justify-end mt-2 space-x-2 ${
                  message.is_mine ? 'text-orange-100' : 'text-gray-500'
                }`}>
                  <span className="text-xs font-medium">{formatTime(message.created_at)}</span>
                  {message.is_mine && (
                    <div className="flex items-center">
                      {message.is_read_by_recipient ? (
                        <CheckCheck size={14} className="text-orange-100" />
                      ) : (
                        <Check size={14} className="text-orange-200" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-6 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner pr-14 text-black placeholder-gray-500"
              disabled={sending}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100/50 rounded-full transition-all duration-300"
            >
              <Smile size={20} className="text-gray-400" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const ConversationList = ({ conversations, onSelectConversation, selectedConversation }) => {
  const { user } = useAuth();

  const getOtherUser = (conversation) => {
    if (!user) return null;
    return conversation.other_participant || null;
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffInDays = diff / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-full bg-transparent">
      <div className="p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-black flex items-center">
          <MessageCircle size={24} className="mr-3 text-orange-500" />
          Messages
        </h2>
      </div>
      
      <div className="overflow-y-auto h-full bg-gray-50/30">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 p-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-500">Start chatting with sellers about their parts!</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherUser(conversation);
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-6 border-b border-gray-200/30 hover:bg-white/50 cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                  selectedConversation?.id === conversation.id ? 'bg-orange-50/80 border-orange-200 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {otherUser?.name?.charAt(0)?.toUpperCase() || otherUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-black truncate text-lg">
                        {otherUser?.name || otherUser?.username || 'Unknown User'}
                      </h3>
                      <div className="flex items-center space-x-3">
                        {conversation.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[24px] text-center shadow-lg">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 font-medium">
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      </div>
                    </div>
                    
                    {conversation.related_spare_part_name && (
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <Package size={14} className="mr-2 text-orange-500" />
                        {conversation.related_spare_part_name}
                      </p>
                    )}
                    
                    {conversation.last_message && (
                      <p className="text-sm text-gray-700 truncate font-medium">
                        {conversation.last_message.sender_username === user?.username ? 'You: ' : ''}
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      // Set up polling for new messages every 30 seconds
      const interval = setInterval(fetchConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversation(null);
    fetchConversations(); // Refresh conversations when going back
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] max-w-4xl mx-auto bg-transparent">
      {showChat && selectedConversation ? (
        <ChatWindow 
          conversation={selectedConversation}
          onBack={handleBackToList}
          onClose={handleBackToList}
        />
      ) : (
        <ConversationList 
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          selectedConversation={selectedConversation}
        />
      )}
    </div>
  );
};

export default Chat;
