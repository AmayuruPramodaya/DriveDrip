import { useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      const conversations = response.data.results || response.data || [];
      
      // Calculate total unread messages
      const totalUnread = conversations.reduce((total, conversation) => {
        return total + (conversation.unread_count || 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  };
};

export default useUnreadMessages;
