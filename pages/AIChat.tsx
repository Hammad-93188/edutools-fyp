
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, ArrowLeft, Loader2, ShieldCheck, MessageSquare, History, Plus, ChevronLeft, Search, Edit2, Check } from 'lucide-react';
import { chatWithEduBot } from '../services/gemini';
import Markdown from 'react-markdown';
import { auth, db, saveUserActivity } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { classifyAIError } from '../services/errorUtils';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: any;
}

interface AIChatProps {
  onBack: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

 
  useEffect(() => {
    if (!auth.currentUser) return;

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
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = newMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      const response = await chatWithEduBot(history);
      const assistantMsg = response || 'No response from AI.';
      const updatedMessages: Message[] = [...newMessages, { role: 'model', content: assistantMsg }];
      setMessages(updatedMessages);

      if (auth.currentUser) {
        if (currentSessionId) {
          await updateDoc(doc(db, 'chatSessions', currentSessionId), {
            messages: updatedMessages,
            updatedAt: serverTimestamp()
          });
        } else {
          const title = input.length > 40 ? input.substring(0, 40) + '...' : input;
          const newId = await saveUserActivity('chatSessions', {
            title,
            messages: updatedMessages,
          });
          if (newId) setCurrentSessionId(newId);
        }
      }
    } catch (err) {
      console.error(err);
      const classified = classifyAIError(err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `**Error Encountered:** ${classified.message}\n\n*Technical Details:* ${err instanceof Error ? err.message : String(err)}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-white z-[60] flex overflow-hidden animate-in fade-in duration-300">
      {/* Sidebar Overlay for Mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[65] lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 z-[70] ${showSidebar ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'}`}>
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl">
               <Bot className="h-5 w-5 text-white" />
             </div>
             <span className="font-black text-slate-900 tracking-tight leading-none">AI History</span>
           </div>
           <button 
             onClick={() => setShowSidebar(false)}
             className="p-2 hover:bg-slate-200 rounded-xl text-slate-400"
           >
             <ChevronLeft className="h-5 w-5" />
           </button>
        </div>

        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl text-blue-600 font-bold hover:shadow-lg transition-all active:scale-95 mb-6"
          >
            <Plus className="h-5 w-5" /> New Conversation
          </button>

          <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search chats..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filteredSessions.map(session => (
            <div 
              key={session.id}
              onClick={() => !editingId && loadSession(session)}
              className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                currentSessionId === session.id 
                  ? 'bg-[#002366] text-white shadow-xl shadow-blue-900/10' 
                  : 'bg-white border border-transparent hover:border-slate-200 text-slate-600'
              } ${!editingId ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <MessageSquare className={`h-4 w-4 shrink-0 ${currentSessionId === session.id ? 'text-blue-300' : 'text-slate-400'}`} />
                {editingId === session.id ? (
                  <form 
                    className="flex-1 flex items-center gap-2"
                    onSubmit={(e) => renameSession(e, session.id)}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => renameSession(null as any, session.id)}
                      className="w-full bg-blue-500/20 border border-blue-400/30 rounded px-2 py-1 text-[13px] outline-none text-white focus:bg-blue-500/40"
                    />
                    <button type="submit" className="p-1 hover:text-green-400">
                      <Check className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <span className="text-[13px] font-bold truncate pr-2">{session.title}</span>
                )}
              </div>
              {!editingId && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(session.id);
                      setEditTitle(session.title);
                    }}
                    className={`p-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-all ${
                      currentSessionId === session.id ? 'text-white/60' : 'text-slate-300'
                    }`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className={`p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all ${
                      currentSessionId === session.id ? 'text-white/60' : 'text-slate-300'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredSessions.length === 0 && (
             <div className="text-center py-10">
               <History className="h-8 w-8 text-slate-200 mx-auto mb-2" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Empty Workspace</p>
             </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 mt-auto">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                {auth.currentUser?.email?.charAt(0).toUpperCase() || '?'}
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{auth.currentUser?.displayName || 'Active User'}</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {!showSidebar && (
           <button 
             onClick={() => setShowSidebar(true)}
             className="absolute left-6 top-6 z-10 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl text-slate-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
           >
             <History className="h-6 w-6" />
           </button>
        )}

        {/* Header */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">EduBot Pro</h1>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-600 mt-1">Research Intelligence</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3" />
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-10"
        >
          <div className="max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="h-full py-10 md:py-20 flex flex-col items-center justify-center text-center">
                <div className="bg-[#002366] p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-blue-900/20 mb-6 md:mb-8 animate-in zoom-in duration-500">
                  <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-blue-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter px-4">How can I assist <br className="hidden sm:block" /> your growth today?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full mt-6 md:mt-10 px-4">
                    {[
                        "Optimize my CV for Data Science",
                        "Design a 4-week Python roadmap",
                        "Explain Neural Networks with analogies",
                        "Write a cold email for internships"
                    ].map((hint, i) => (
                        <button 
                            key={i}
                            onClick={() => { setInput(hint); }}
                            className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl md:rounded-3xl text-sm font-bold text-slate-600 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group"
                        >
                            <span className="flex items-center justify-between gap-1">
                              "{hint}"
                              <ChevronLeft className="h-4 w-4 rotate-180 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0" />
                            </span>
                        </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 md:space-y-10">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex gap-3 md:gap-6 animate-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-[#002366] text-white shadow-blue-900/10' : 'bg-white border border-slate-100 text-blue-600 shadow-slate-100'}`}>
                      {msg.role === 'user' ? <User className="h-5 w-5 md:h-6 md:w-6" /> : <Bot className="h-5 w-5 md:h-6 md:w-6" />}
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[75%] p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm relative ${msg.role === 'user' ? 'bg-[#002366] text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                      <div className="markdown-body">
                          <Markdown
                            components={{
                              h1: ({...props}) => <h1 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 mt-6 md:mt-8" {...props} />,
                              h2: ({...props}) => <h2 className="text-xl md:text-2xl font-black mb-3 md:mb-4 mt-4 md:mt-6" {...props} />,
                              h3: ({...props}) => <h3 className="text-lg md:text-xl font-black mb-2 md:mb-3 mt-3 md:mt-5" {...props} />,
                              p: ({...props}) => <p className="mb-3 md:mb-4 leading-relaxed text-sm md:text-[15px] font-medium opacity-90" {...props} />,
                              ul: ({...props}) => <ul className="list-disc ml-6 md:ml-8 mb-4 md:mb-6 space-y-2 md:space-y-3" {...props} />,
                              ol: ({...props}) => <ol className="list-decimal ml-6 md:ml-8 mb-4 md:mb-6 space-y-2 md:space-y-3" {...props} />,
                              li: ({...props}) => <li className="leading-relaxed text-sm md:text-[15px] font-medium" {...props} />,
                              strong: ({...props}) => <strong className="font-extrabold text-blue-500" {...props} />,
                              code: ({...props}) => <code className="bg-slate-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg font-mono text-xs md:text-sm text-blue-700 border border-slate-100" {...props} />,
                              blockquote: ({...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic bg-blue-50 rounded-r-2xl mb-4" {...props} />,
                            }}
                          >
                            {msg.content}
                          </Markdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="flex gap-6 animate-pulse items-center">
                <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Bot className="h-6 w-6 text-slate-300" />
                </div>
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] rounded-tl-none w-32 flex items-center justify-center shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Section */}
        <footer className="bg-white p-4 md:p-10 border-t border-slate-100">
          <div className="max-w-4xl mx-auto relative group">
            <form onSubmit={handleSend} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message EduBot Pro..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2rem] py-4 md:py-5 px-6 md:px-8 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-medium text-base md:text-lg min-h-[60px] md:min-h-[80px] max-h-[300px] shadow-sm resize-none"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 md:right-3 md:bottom-3 bg-[#002366] text-white p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-xl hover:shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </form>
            <div className="mt-3 md:mt-4 flex flex-col sm:flex-row justify-between items-center px-2 md:px-6 gap-2">
              <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.1em]" />
              <div className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-50">
                  Ctrl + Enter to send
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AIChat;
