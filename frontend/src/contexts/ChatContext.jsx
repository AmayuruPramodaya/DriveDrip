import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { unreadCount, refetch: refetchUnread } = useUnreadMessages();
  const [newMessageNotification, setNewMessageNotification] = useState(null);

  // Function to show notification for new message
  const showNewMessageNotification = (message, conversation) => {
    if (!user || message.sender === user.id) return;
    
    const otherUser = user.id === conversation.buyer ? 
      { username: conversation.seller_username, name: conversation.seller_name } :
      { username: conversation.buyer_username, name: conversation.buyer_name };

    setNewMessageNotification({
      id: Date.now(),
      message: message.content,
      sender: otherUser.name || otherUser.username,
      conversation: conversation,
      timestamp: new Date()
    });

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNewMessageNotification(null);
    }, 5000);

    // Refresh unread count
    refetchUnread();
  };

  const dismissNotification = () => {
    setNewMessageNotification(null);
  };

  const contextValue = {
    unreadCount,
    newMessageNotification,
    showNewMessageNotification,
    dismissNotification,
    refetchUnread
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Toast */}
      {newMessageNotification && (
        <div className="fixed top-20 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {newMessageNotification.sender.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {newMessageNotification.sender}
              </p>
              <p className="text-gray-600 text-sm truncate">
                {newMessageNotification.message}
              </p>
            </div>
            <button
              onClick={dismissNotification}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </ChatContext.Provider>
  );
};

export default ChatContext;
