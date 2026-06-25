
import React, { useState } from 'react';
import { Menu, X, BookOpen, User as UserIcon, LogOut, Bot, Clock } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  user: any;
  onAuthClick: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, user, onAuthClick, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Tool Kit', id: 'toolkit' },
    ...(user ? [{ name: 'Dashboard', id: 'dashboard' }] : []),
    { name: 'About Us', id: 'about' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <nav className="bg-[#002366] text-white sticky top-0 z-50 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="bg-blue-500 p-1.5 md:p-2 rounded-lg md:rounded-xl mr-2 md:mr-3 group-hover:rotate-12 transition-transform">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter">EduTools</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <div className="flex items-baseline space-x-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    currentPage === link.id ? 'bg-white/10 text-white' : 'text-blue-100/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-white/10 mx-2"></div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('aichat')}
                className="hidden lg:flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl font-bold text-sm border border-blue-500/20 transition-all mr-2"
              >
                <Bot className="h-4 w-4" /> Ask AI
              </button>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-blue-400" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold hidden lg:block">{user.displayName || user.email.split('@')[0]}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => onAuthClick('login')}
                    className="text-sm font-bold text-blue-100 hover:text-white transition-colors px-4 py-2"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => onAuthClick('signup')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={() => onNavigate('aichat')}
              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20"
              title="Ask AI"
            >
              <Bot className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-[#001a4d] border-t border-white/10 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-bold ${
                  currentPage === link.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-blue-700/50'
                }`}
              >
                {link.name}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-3 px-4">
              {user ? (
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-center py-3 font-bold text-red-400 border border-red-400/20 rounded-xl">Logout</button>
              ) : (
                <>
                  <button onClick={() => { onAuthClick('login'); setIsOpen(false); }} className="w-full text-center py-3 font-bold text-blue-100 border border-white/10 rounded-xl">Sign In</button>
                  <button onClick={() => { onAuthClick('signup'); setIsOpen(false); }} className="w-full text-center py-3 font-bold bg-blue-600 text-white rounded-xl">Create Account</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
