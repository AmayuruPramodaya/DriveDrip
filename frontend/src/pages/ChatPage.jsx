import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';
import { MessageCircle } from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/30">
          <MessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access your messages.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center">
              <MessageCircle size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-black">Messages</h1>
          </div>
          <p className="text-gray-600">
            {user.role === 'BUYER' 
              ? 'Chat with sellers and mechanics about their services' 
              : user.role === 'SELLER'
              ? 'Respond to buyer inquiries about your parts'
              : 'Communicate with customers about service requests'
            }
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 overflow-hidden">
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
