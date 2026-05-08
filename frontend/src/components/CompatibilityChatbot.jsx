import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { sparePartsAPI } from '../services/api';

const CompatibilityChatbot = ({ partId, partName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: `Hi! I'm here to help you check if the ${partName} is compatible with your vehicle. Ask me questions like "Will this fit my 2019 Honda Civic?" or "Is this compatible with Toyota vehicles?"`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userQuestion }]);

    try {
      const response = await sparePartsAPI.askCompatibilityQuestion(partId, userQuestion);
      
      // Add bot response
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: response.data.response,
        interactionId: response.data.interaction_id
      }]);
    } catch (error) {
      console.error('Compatibility chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try asking your question again or contact the seller directly.',
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Will this fit my Honda Civic?",
    "Is this compatible with Toyota vehicles?",
    "What year range does this support?",
    "Does this work with manual transmission?",
    "Is this part universal?"
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Chatbot Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Compatibility Assistant</h3>
            <p className="text-sm text-gray-500">Ask about vehicle compatibility</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Chat Interface */}
      {isOpen && (
        <div className="border-t border-gray-200">
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-orange-500 text-white'
                      : message.error
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedQuestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(suggestion)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about compatibility..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!question.trim() || isLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompatibilityChatbot;
