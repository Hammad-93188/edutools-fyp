
import React, { useEffect, useState } from 'react';
import { LayoutGrid, PenTool, FileSearch, Mail, ArrowRight, BrainCircuit, Users, ShieldCheck, Zap, Star, Bot, Activity } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where, getCountFromServer } from 'firebase/firestore';

interface HomeProps {
  onStart: (toolId?: string) => void;
  onGetStarted: () => void;
  onNavigate: (page: string) => void;
  user: any;
}

const Home: React.FC<HomeProps> = ({ onStart, onGetStarted, onNavigate, user }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0 });

  useEffect(() => {
    setIsVisible(true);
    const statsUnsubscribe = onSnapshot(doc(db, 'stats', 'global'), (doc) => {
      if (doc.exists()) {
        setStats(prev => ({ ...prev, totalUsers: doc.data().totalUsers || 0 }));
      }
    });

    const activeInterval = setInterval(async () => {
      try {
        const presenceQuery = query(
          collection(db, 'presence'),
          where('lastSeen', '>', new Date(Date.now() - 5 * 60 * 1000))
        );
        const snapshot = await getCountFromServer(presenceQuery);
        setStats(prev => ({ ...prev, activeUsers: snapshot.data().count }));
      } catch (e) {
        console.error("Active count failed", e);
      }
    }, 30000);

    return () => {
      statsUnsubscribe();
      clearInterval(activeInterval);
    };
  }, []);

  const features = [
    {
      id: 'handwritten',
      title: 'Handwrite AI',
      desc: 'Convert digital text into realistic handwritten assignments on professional layouts.',
      icon: PenTool,
      color: 'bg-blue-500',
    },
    {
      id: 'ats',
      title: 'ATS CV Analyzer',
      desc: 'Beat applicant tracking systems with AI-driven resume scoring and keyword insights.',
      icon: FileSearch,
      color: 'bg-indigo-600',
    },
    {
      id: 'quiz-gen',
      title: 'Quiz Master',
      desc: 'Instantly generate high-quality assessments from any academic topic or text.',
      icon: BrainCircuit,
      color: 'bg-emerald-500',
    },
    {
      id: 'email-gen',
      title: 'AI Emailer',
      desc: 'Draft perfect professional emails in any tone and language in seconds.',
      icon: Mail,
      color: 'bg-cyan-500',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="bg-[#002366] text-white py-24 md:py-32 px-4 relative">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-blue-600 rounded-full opacity-10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[400px] h-[400px] bg-indigo-600 rounded-full opacity-10 blur-[100px]"></div>
        
        <div className={`max-w-7xl mx-auto text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 bg-blue-800/40 backdrop-blur-md px-4 py-2 rounded-full text-blue-300 text-xs md:text-sm font-bold mb-6 md:mb-8 border border-blue-700/50">
            <Zap className="h-3 w-3 md:h-4 md:w-4 fill-current" /> Next-Gen Academic Utilities
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight px-2">
            Empower Your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">Academic Journey</span>
          </h1>
          <p className="text-lg md:text-2xl text-blue-100/70 mb-8 md:mb-12 max-w-3xl mx-auto font-medium leading-relaxed px-4 md:px-0">
            A high-performance suite of AI tools designed for students and educators to simplify assignments, career growth, and teaching.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => user ? onStart() : onGetStarted()}
              className="bg-white text-[#002366] px-12 py-5 rounded-full font-black text-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-blue-500/20 active:scale-95 flex items-center gap-3 w-full sm:w-auto"
            >
              {user ? 'Go to ToolKit' : 'Get Started Now'} <ArrowRight className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-full border border-white/20 group cursor-pointer hover:bg-white/20 transition-all" onClick={() => onNavigate('aichat')}>
              <div className="bg-blue-500 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 leading-none mb-1">Need Help?</p>
                <p className="text-sm font-bold text-white leading-none">Ask EduBot AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Powerful Tools for Every Task</h2>
            <p className="text-gray-500 font-medium">Streamlined, AI-powered, and designed for maximum efficiency.</p>
            <div className="w-24 h-1.5 bg-blue-600 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, idx) => (
              <div 
                key={feature.id}
                className={`bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group transition-delay-[${idx * 100}ms]`}
                onClick={() => onStart(feature.id)}
              >
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm mb-8">
                  {feature.desc}
                </p>
                <div className="flex items-center text-blue-600 font-bold group-hover:gap-3 transition-all gap-2 text-sm mt-auto">
                  Launch {feature.title.split(' ')[0]} <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="bg-blue-100 rounded-[3rem] p-4 rotate-3 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800" 
                alt="AI Platform" 
                className="rounded-[2.5rem] shadow-2xl grayscale-0 hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600 rounded-full blur-[100px] opacity-10"></div>
          </div>
          
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-6">Why Educators & Students <br /> Love EduTools</h2>
              <p className="text-gray-600 text-lg">We don't just build tools; we build productivity shortcuts that save you hours of manual labor every week.</p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Zap, title: "Lightning Fast", desc: "Results in seconds, not hours. Our AI models are tuned for performance." },
                { icon: ShieldCheck, title: "Secure Dashboard", desc: "Save your resumes, emails, and quizzes to your personal secure dashboard." },
                { icon: Users, title: "Teacher-Approved", desc: "Designed with feedback from educators to ensure real academic value." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 p-6 hover:bg-gray-50 rounded-[2rem] transition-colors border border-transparent hover:border-gray-100">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl h-fit">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#002366] text-white px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400 rounded-full blur-[150px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 text-center mb-16">
            <div>
              <div className="text-5xl font-black text-blue-400 mb-2">{stats.totalUsers > 100 ? `${(stats.totalUsers/1000).toFixed(1)}k+` : stats.totalUsers}</div>
              <div className="text-blue-100/50 font-bold uppercase tracking-widest text-xs">Community Members</div>
            </div>
            <div>
              <div className="text-5xl font-black text-emerald-400 mb-2 flex items-center justify-center gap-2">
                <Activity className="h-8 w-8 animate-pulse" />
                {stats.activeUsers || 1}
              </div>
              <div className="text-blue-100/50 font-bold uppercase tracking-widest text-xs">Active Now</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Activity className="h-6 w-6 text-emerald-400" />
              <h4 className="text-xl font-bold">Personalized Learning Hub</h4>
            </div>
            <p className="text-blue-100/60 text-sm leading-relaxed">
              Track your progress and access your saved academic assets anywhere. 
              EduTools now securely saves your analysis history and generated content to your personal dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
