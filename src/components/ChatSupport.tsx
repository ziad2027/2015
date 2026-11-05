import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import { 
  sendMessage, 
  subscribeToMessages, 
  markAsRead, 
  subscribeToConversation 
} from '../services/chatService';
import { ChatMessage, Conversation, UserProfile } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChatSupportProps {
  userProfile: UserProfile | null;
  onBack: () => void;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ userProfile, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to messages
    const unsubscribeMessages = subscribeToMessages(currentUser.uid, (msgs) => {
      setMessages(msgs);
      // Mark as read when messages arrive and we are in the chat
      markAsRead(currentUser.uid, false);
    });

    // Subscribe to conversation for status and unread counts
    const unsubscribeConv = subscribeToConversation(currentUser.uid, (conv) => {
      setConversation(conv);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeConv();
    };
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const text = inputText;
    setInputText('');

    await sendMessage(
      currentUser.uid,
      currentUser.uid,
      text,
      false,
      userProfile ? { 
        displayName: userProfile.displayName, 
        phone: userProfile.phone 
      } : undefined
    );
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="text-red-600 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">يرجى تسجيل الدخول</h2>
        <p className="text-gray-600">يجب عليك تسجيل الدخول لتتمكن من التواصل مع الإدارة.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-4xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            ق
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">تواصل مع الإدارة</h2>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs text-gray-500">متصل الآن</span>
            </div>
          </div>
        </div>
        {conversation?.status === 'closed' && (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
            المحادثة مغلقة
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-75">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-xs">
              <MessageSquare className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium leading-relaxed">
                مرحباً بك! يمكنك إرسال استفساراتك أو بلاغاتك هنا، وسيقوم فريق الإدارة بالرد عليك في أقرب وقت.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? 'bg-red-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-left ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'p', { locale: ar }) : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 sticky bottom-0">
        {conversation?.status === 'closed' ? (
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">تم إغلاق هذه المحادثة من قبل الإدارة.</p>
            <button 
              onClick={() => handleSendMessage({ preventDefault: () => {} } as any)}
              className="text-red-600 text-sm font-bold mt-1 hover:underline"
            >
              بدء محادثة جديدة؟
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-gray-100 border-none focus:ring-2 focus:ring-red-500 rounded-xl px-4 py-3 text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shadow-lg"
            >
              <Send className="w-5 h-5 transform rotate-180" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatSupport;
