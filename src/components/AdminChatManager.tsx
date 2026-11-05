import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Send, 
  ChevronLeft,
  Filter,
  XCircle
} from 'lucide-react';
import { 
  subscribeToAllConversations, 
  subscribeToMessages, 
  sendMessage, 
  markAsRead, 
  updateConversationStatus 
} from '../services/chatService';
import { Conversation, ChatMessage, ConversationStatus } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const AdminChatManager: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllConversations(setConversations);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(selectedUserId, (msgs) => {
      setMessages(msgs);
      markAsRead(selectedUserId, true);
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUserId) return;

    const text = inputText;
    setInputText('');

    await sendMessage(
      selectedUserId,
      'admin', // Or actual admin UID if preferred
      text,
      true
    );
  };

  const handleStatusChange = async (userId: string, status: ConversationStatus) => {
    await updateConversationStatus(userId, status);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.userPhone && conv.userPhone.includes(searchTerm));
    
    const matchesFilter = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const selectedConversation = conversations.find(c => c.id === selectedUserId);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100" dir="rtl">
      {/* Sidebar - Conversation List */}
      <div className={`w-full lg:w-96 border-l bg-gray-50 flex flex-col ${selectedUserId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 bg-white border-b sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">إدارة الرسائل</h2>
          
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث باسم المستخدم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'new', 'read', 'replied', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'الكل' : 
                 status === 'new' ? 'جديد' : 
                 status === 'read' ? 'تمت القراءة' : 
                 status === 'replied' ? 'تم الرد' : 'مغلق'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا توجد محادثات تطابق البحث</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedUserId(conv.id)}
                className={`w-full p-4 flex items-start gap-3 border-b transition-all hover:bg-white text-right ${
                  selectedUserId === conv.id ? 'bg-white border-r-4 border-r-red-600' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                    {conv.userDisplayName.charAt(0)}
                  </div>
                  {conv.unreadCountByAdmin > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {conv.unreadCountByAdmin}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 truncate text-sm">{conv.userDisplayName}</h3>
                    <span className="text-[10px] text-gray-400">
                      {conv.updatedAt?.toDate ? format(conv.updatedAt.toDate(), 'p', { locale: ar }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">
                    {conv.lastMessage || 'بدأ محادثة جديدة'}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={conv.status} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main - Chat Content */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedUserId ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
        {!selectedUserId ? (
          <div className="text-center p-8">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-red-600 opacity-50" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">اختر محادثة للمتابعة</h3>
            <p className="text-gray-500 max-w-xs mx-auto">يمكنك البدء بالرد على رسائل المستخدمين وتقديم المساعدة اللازمة.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="p-2 hover:bg-gray-100 rounded-full lg:hidden"
                >
                  <ChevronLeft className="w-5 h-5 transform rotate-180" />
                </button>
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConversation?.userDisplayName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedConversation?.userDisplayName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3 h-3" />
                    <span>{selectedConversation?.userPhone || 'بدون هاتف'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation?.status !== 'closed' ? (
                  <button
                    onClick={() => handleStatusChange(selectedUserId, 'closed')}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                  >
                    <XCircle className="w-4 h-4" />
                    إغلاق المحادثة
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(selectedUserId, 'new')}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                  >
                    <Clock className="w-4 h-4" />
                    إعادة فتح
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.isAdmin 
                      ? 'bg-red-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-left ${msg.isAdmin ? 'text-red-100' : 'text-gray-400'}`}>
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'p', { locale: ar }) : 'جاري الإرسال...'}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Input Area */}
            <div className="p-4 bg-white border-t">
              {selectedConversation?.status === 'closed' ? (
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">هذه المحادثة مغلقة. أعد فتحها لتتمكن من الرد.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    <Send className="w-5 h-5 transform rotate-180" />
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: ConversationStatus }> = ({ status }) => {
  switch (status) {
    case 'new':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
          <Clock className="w-3 h-3" />
          جديد
        </span>
      );
    case 'read':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3" />
          تمت القراءة
        </span>
      );
    case 'replied':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
          <MessageSquare className="w-3 h-3" />
          تم الرد
        </span>
      );
    case 'closed':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
          <XCircle className="w-3 h-3" />
          مغلق
        </span>
      );
    default:
      return null;
  }
};

export default AdminChatManager;
