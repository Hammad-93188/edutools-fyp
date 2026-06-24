
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ToolKit from './pages/ToolKit';
import Contact from './pages/Contact';
import About from './pages/About';
import HandwrittenPro from './components/HandwrittenPro';
import CVAnalyzer from './components/CVAnalyzer';
import EmailGenerator from './components/EmailGenerator';
import QuizGenerator from './components/QuizGenerator';
import StudyPlanner from './components/StudyPlanner';
import ResumeMaker from './components/ResumeMaker';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import ChatBot from './components/ChatBot';
import { X, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, ChevronRight, LogOut, AlertCircle } from 'lucide-react';
import { 
  auth, 
  db,
  onAuthStateChanged, 
  loginWithGoogle, 
  logoutUser, 
  signupWithEmail, 
  loginWithEmail,
  sendPasswordReset,
  getSignInMethods,
  handleFirestoreError,
  OperationType
} from './services/firebase';
import { doc, getDocFromServer, setDoc, serverTimestamp, updateDoc, increment, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showEmailError, setShowEmailError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: any) => {
     
      const isUnverifiedPassword =
        currentUser &&
        !currentUser.emailVerified &&
        (currentUser.providerData?.some((p: any) => p.providerId === 'password') ?? false);

      if (!currentUser || isUnverifiedPassword) {
        setUser(null);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        setIsAuthModalOpen(false);
        
       
        const userRef = doc(db, 'presence', currentUser.uid);
        const statsRef = doc(db, 'stats', 'global');
        const profileRef = doc(db, 'users', currentUser.uid);
        
        const userSnap = await getDocFromServer(userRef);
        if (!userSnap.exists()) {
          try {
            await updateDoc(statsRef, {
              totalUsers: increment(1)
            });
            
      
            await setDoc(profileRef, {
              userId: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              createdAt: serverTimestamp()
            }, { merge: true });

          } catch (e) {
          
            await setDoc(statsRef, { totalUsers: 1, activeUsers: 1 }, { merge: true });
          }
        }
      
        const updatePresence = async () => {
          try {
            await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true });
          } catch (e) {
            console.error("Presence update failed", e);
          }
        };
        
        updatePresence();
        const interval = setInterval(updatePresence, 60000); 
        return () => clearInterval(interval);
      }
    });

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  const navigateTo = (page: string) => {
   
    if ((page === 'tool' || page === 'dashboard' || page === 'aichat') && !user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentPage(page);
    setActiveTool(null);
    window.scrollTo(0, 0);
  };

  const startTool = (toolId?: string) => {
    
    if (toolId && !user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    
    if (toolId) {
      setActiveTool(toolId);
      setCurrentPage('tool');
    } else {
      setCurrentPage('toolkit');
    }
    window.scrollTo(0, 0);
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return '';
    return re.test(email) ? '' : 'Please enter a professional email address';
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
    }
    if (pass.length >= 6 && hasLetters && hasNumbers) {
      return { score: 2, label: 'Normal', color: 'bg-amber-500' };
    }
    return { score: 1, label: 'Weak', color: 'bg-red-500' };
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);

    const emailErr = validateEmail(authEmail);
    if (emailErr) {
      setEmailError(emailErr);
      setShowEmailError(true);
      return;
    }

    if (authPass.length < 6) {
      setAuthNotice({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);
    try {
    
      const methods = await getSignInMethods(authEmail);

      if (authMode === 'signup') {
        if (methods.includes('google.com')) {
          setAuthNotice({ type: 'error', text: 'This email is already registered with Google. Please use the "Sign in with Google" button instead.' });
          setIsLoading(false);
          return;
        }
        if (methods.includes('password')) {
          setAuthNotice({ type: 'error', text: 'An account with this email already exists. Switch to the Login tab to sign in.' });
          setIsLoading(false);
          return;
        }
        await signupWithEmail(authEmail, authPass, fullName);
        setAuthMode('login');
        setAuthPass('');
        setFullName('');
        setAuthNotice({ type: 'success', text: `✓ Account created successfully! A verification link has been sent to ${authEmail}. Please open your inbox (check spam too), click the link to verify, then log in below.` });
      } else {
        if (methods.length > 0 && !methods.includes('password') && methods.includes('google.com')) {
          setAuthNotice({ type: 'error', text: 'This email uses Google sign-in. Please use the "Sign in with Google" button, or click "Forgot password?" to set a password.' });
          setIsLoading(false);
          return;
        }
        await loginWithEmail(authEmail, authPass);
        navigateTo('dashboard');
      }
    } catch (err: any) {
      const code = err?.code || '';
      let friendly = err?.message || 'Something went wrong. Please try again.';
      if (code === 'auth/email-not-verified') {
        setAuthNotice({ type: 'success', text: friendly });
        setIsLoading(false);
        return;
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        friendly = 'Incorrect email or password. If you signed up with Google, use the "Sign in with Google" button, or click "Forgot password?" to set a password.';
      } else if (code === 'auth/email-already-in-use') {
        friendly = 'An account with this email already exists. Switch to the Login tab to sign in.';
      } else if (code === 'auth/weak-password') {
        friendly = 'Password is too weak. Please use at least 6 characters.';
      } else if (code === 'auth/invalid-email') {
        friendly = 'That email address is not valid. Please check it and try again.';
      } else if (code === 'auth/network-request-failed') {
        friendly = 'Network error. Check your internet connection and try again.';
      }
      setAuthNotice({ type: 'error', text: friendly });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      navigateTo('dashboard');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleForgotPassword = async () => {
    setAuthNotice(null);
    if (!authEmail || validateEmail(authEmail)) {
      setAuthNotice({ type: 'error', text: 'Please type your account email in the email field first, then click "Forgot password?".' });
      return;
    }
    try {
      await sendPasswordReset(authEmail);
      setAuthNotice({ type: 'success', text: `A password reset link has been sent to ${authEmail}. Check your inbox (and spam folder), set a new password, then log in with it.` });
    } catch (err: any) {
      setAuthNotice({ type: 'error', text: err.message });
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigateTo('home');
  };

  const renderPage = () => {
    if (currentPage === 'home') return <Home onStart={startTool} onGetStarted={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }} onNavigate={navigateTo} user={user} />;
    if (currentPage === 'toolkit') return <ToolKit onSelectTool={startTool} />;
    if (currentPage === 'aichat') return <AIChat onBack={() => navigateTo('home')} />;
    if (currentPage === 'dashboard') {
      if (!user) {
        setCurrentPage('home');
        return <Home onStart={startTool} onGetStarted={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }} onNavigate={navigateTo} user={user} />;
      }
      return <Dashboard onNavigate={navigateTo} onSelectTool={startTool} />;
    }
    if (currentPage === 'about') return <About />;
    if (currentPage === 'contact') return <Contact />;
    
    if (currentPage === 'tool') {
      switch (activeTool) {
        case 'handwritten': return <HandwrittenPro />;
        case 'ats': return <CVAnalyzer />;
        case 'email-gen': return <EmailGenerator />;
        case 'quiz-gen': return <QuizGenerator />;
        case 'study-planner': return <StudyPlanner />;
        case 'resume-maker': return <ResumeMaker />;
        default: return <ToolKit onSelectTool={startTool} />;
      }
    }
    return <Home onStart={startTool} onGetStarted={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }} onNavigate={navigateTo} user={user} />;
  };

  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Application Error</h2>
          <p className="text-gray-600 mb-6">{appError}</p>
          <button 
            onClick={() => setAppError(null)}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar 
        onNavigate={navigateTo} 
        currentPage={currentPage} 
        user={user}
        onAuthClick={(mode) => { setAuthMode(mode || 'signup'); setIsAuthModalOpen(true); }}
        onLogout={handleLogout}
      />
      
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Firebase Auth Modal */}
      {isAuthModalOpen && !user && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="bg-[#002366] p-6 text-white text-center">
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-black mb-1">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p className="text-blue-100/70 text-sm">Access your personalized EduTools suite.</p>
            </div>
            
            <div className="p-6 pb-4">
              {authNotice && (
                <div
                  ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}
                  className={`mb-5 p-4 rounded-2xl text-sm font-semibold leading-snug border-2 ${
                  authNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {authNotice.text}
                </div>
              )}
              <button 
                onClick={handleGoogleAuth}
                className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 mb-5 shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Or use email</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="px-6 pb-6 space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe" 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" 
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    value={authEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAuthEmail(val);
                      const err = validateEmail(val);
                      setEmailError(err);
                      if (!err) setShowEmailError(false);
                    }}
                    onBlur={() => {
                      if (authEmail) setShowEmailError(!!emailError);
                    }}
                    placeholder="name@email.com" 
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${showEmailError && emailError ? 'border-red-500' : 'border-slate-200'} rounded-2xl outline-none focus:border-blue-500 transition-all font-medium`} 
                  />
                </div>
                {showEmailError && emailError && <p className="text-[10px] font-bold text-red-500 ml-1">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="password" 
                    required 
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" 
                  />
                </div>
                {authMode === 'signup' && authPass && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strength: {getPasswordStrength(authPass).label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full transition-all duration-500 ${getPasswordStrength(authPass).color}`} style={{ width: `${(getPasswordStrength(authPass).score / 3) * 100}%` }}></div>
                    </div>
                  </div>
                )}
                {authMode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-bold text-blue-600 hover:underline mt-1 mr-1"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Join EduTools')} <ArrowRight className="h-5 w-5" />
              </button>

              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthNotice(null); }}
                  className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-black text-[#002366] mb-2 tracking-tighter">EduTools</span>
            <p className="text-gray-400 text-xs font-medium">Professional Student & Career Utility Suite</p>
          </div>
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} EduTools Pro • Built in Pakistan
          </div>
          <div className="flex gap-8 text-sm font-bold text-gray-500">
            <button onClick={() => navigateTo('about')} className="hover:text-blue-600 transition-colors">Our Story</button>
            <button onClick={() => navigateTo('contact')} className="hover:text-blue-600 transition-colors">Support</button>
            <button onClick={() => navigateTo('about')} className="hover:text-blue-600 transition-colors">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
