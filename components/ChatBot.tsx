import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, MessageSquare, History, Plus, ChevronLeft, Trash2, Search, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithEduBot } from '../services/gemini';
import { auth, db, saveUserActivity } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: any;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Hi there! I am **EduBot**. How can I assist you with your studies or career today?' }
  ]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync sessions if logged in
  useEffect(() => {
    if (!auth.currentUser) {
      setSessions([]);
      return;
    }

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(sessionData);
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { role: 'model', content: 'Hi there! I am **EduBot**. How can I assist you with your studies or career today?' }
    ]);
    if (window.innerWidth < 640) setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    if (window.innerWidth < 640) setShowHistory(false);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      if (editingId === id) setEditingId(null);
      await deleteDoc(doc(db, 'chatSessions', id));
      if (currentSessionId === id) startNewChat();
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const renameSession = async (e: React.MouseEvent | React.FormEvent, id: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'chatSessions', id), {
        title: editTitle.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const geminiHistory = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await chatWithEduBot(geminiHistory);
      const assistantMsg = response || "I'm sorry, I couldn't process that.";
      const updatedMessages: ChatMessage[] = [...newMessages, { role: 'model', content: assistantMsg }];
      setMessages(updatedMessages);

      // Save or update session in Firebase
      if (auth.currentUser) {
        if (currentSessionId) {
          // Update existing
          await updateDoc(doc(db, 'chatSessions', currentSessionId), {
            messages: updatedMessages,
            updatedAt: serverTimestamp()
          });
        } else {
          // Create new session
          const title = userMsg.length > 30 ? userMsg.substring(0, 30) + '...' : userMsg;
          const newId = await saveUserActivity('chatSessions', {
            title,
            messages: updatedMessages,
          });
          if (newId) setCurrentSessionId(newId);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: "Something went wrong. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserLoggedIn = !!auth.currentUser;

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
      {!isOpen && (
        <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-blue-50 border-l-4 border-l-blue-600 relative mb-1 max-w-[200px]">
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-tighter">EduBot AI</p>
            <p className="text-xs text-gray-600 font-medium">Need help with your assignments or CV?</p>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-blue-50 rotate-45"></div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="group relative bg-[#002366] text-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,35,102,0.3)] hover:shadow-[0_20px_60px_rgba(0,35,102,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 overflow-hidden"
          >
            <span className="absolute inset-0 bg-blue-400/20 animate-ping rounded-full"></span>
            
            <div className="relative z-10 bg-blue-500 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <Bot className="h-6 w-6" />
            </div>
            <div className="relative z-10 flex flex-col items-start pr-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 leading-none mb-1">AI Assistant</span>
              <span className="text-sm font-black leading-none">Chat with EduBot</span>
            </div>
          </button>
        </div>
      )}

      {isOpen && (
        <div className={`bg-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] flex rounded-[2.5rem] overflow-hidden border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 ${
          isUserLoggedIn ? 'w-[calc(100vw-48px)] sm:w-[750px]' : 'w-[calc(100vw-48px)] sm:w-[380px]'
        } h-[600px]`}>
          
          {/* Sidebar - Only for Logged In Users */}
          {isUserLoggedIn && (
            <div className={`bg-slate-50 border-r border-gray-100 h-full flex flex-col transition-all duration-300 ${
              showHistory ? 'w-[280px]' : 'w-0 sm:w-20'
            } overflow-hidden`}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                {showHistory && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chat History</span>}
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 hover:bg-gray-200 rounded-xl text-slate-500 transition-colors"
                >
                  {showHistory ? <ChevronLeft className="h-5 w-5" /> : <History className="h-6 w-6" />}
                </button>
              </div>

              <div className="p-3 space-y-3">
                <button 
                  onClick={startNewChat}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-900/10 ${!showHistory && 'justify-center p-4'}`}
                  title="New Chat"
                >
                  <Plus className="h-5 w-5" />
                  {showHistory && <span className="text-xs font-black uppercase tracking-tight">New Chat</span>}
                </button>

                {showHistory && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {filteredSessions.length > 0 ? (
                  <div className="space-y-2">
                    {filteredSessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => !editingId && loadSession(session)}
                        className={`w-full group flex items-center justify-between gap-3 p-3 rounded-2xl transition-all text-left ${
                          currentSessionId === session.id 
                            ? 'bg-[#002366] text-white shadow-lg' 
                            : 'bg-white border border-transparent hover:border-gray-200 text-slate-600'
                        } ${!editingId ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <MessageSquare className={`h-4 w-4 shrink-0 ${currentSessionId === session.id ? 'text-blue-300' : 'text-slate-400'}`} />
                          {showHistory && (
                            editingId === session.id ? (
                              <form 
                                className="flex-1 flex items-center gap-1"
                                onSubmit={(e) => renameSession(e, session.id)}
                                onClick={e => e.stopPropagation()}
                              >
                                <input
                                  autoFocus
                                  type="text"
                                  value={editTitle}
                                  onChange={e => setEditTitle(e.target.value)}
                                  onBlur={(e) => renameSession(e, session.id)}
                                  className="w-full bg-blue-500/20 border border-blue-400/30 rounded px-1.5 py-0.5 text-xs outline-none text-white focus:bg-blue-500/40"
                                />
                                <button type="submit" className="p-1 hover:text-green-400">
                                  <Check className="h-3 w-3" />
                                </button>
                              </form>
                            ) : (
                              <span className="text-xs font-bold truncate max-w-[150px]">
                                {session.title}
                              </span>
                            )
                          )}
                        </div>
                        {showHistory && !editingId && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(session.id);
                                setEditTitle(session.title);
                              }}
                              className={`p-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-colors ${currentSessionId === session.id ? 'text-white/60' : 'text-slate-300'}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={(e) => deleteSession(e, session.id)}
                              className={`p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors ${currentSessionId === session.id ? 'text-white/60' : 'text-slate-300'}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !isInitialLoad && showHistory && (
                    <div className="text-center py-10 px-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {searchQuery ? 'No matches found' : 'No previous chats'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="bg-[#002366] p-6 text-white flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-2xl shadow-lg">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none mb-1">EduBot Pro</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Always Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors relative z-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] p-4 rounded-2x rounded-[1.5rem] text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#002366] text-white rounded-tr-none shadow-lg' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                  }`}>
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none text-sm shadow-sm border border-gray-100 flex gap-1.5">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-blue-300 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-2 bg-transparent outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-[#002366] text-white p-3 rounded-xl disabled:opacity-50 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {!isUserLoggedIn && (
                <p className="text-[10px] text-center mt-2 text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-1 rounded-lg">
                  Login to save your chat history
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
