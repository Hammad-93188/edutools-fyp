
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  Mail, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  ChevronRight,
  ArrowUpRight,
  User,
  Calendar,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Zap,
  Target,
  Trophy,
  BrainCircuit,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  generateDashboardInsights,
  getAIEngineMode,
  setAIEngineMode,
  isCloudApiKeyAvailable,
  getActiveEngineLabel
} from '../services/gemini';
import { localGenerateDashboardInsights } from '../services/localTools';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Network, Cpu, ShieldCheck as LocalShieldCheck, Server, ToggleLeft, ToggleRight, CheckSquare } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onSelectTool: (toolId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectTool }) => {
  const [loading, setLoading] = useState(true);
  const [engineMode, setEngineMode] = useState<'auto' | 'local'>(getAIEngineMode());
  const [apiAvailable, setApiAvailable] = useState(isCloudApiKeyAvailable());
  const [stats, setStats] = useState({
    analyses: 0,
    quizzes: 0,
    emails: 0,
    studyPlans: 0,
    resumes: 0,
    handwritten: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [insights, setInsights] = useState<{ mainInsight: string, recommendation: string, skillGrowth: number } | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!auth.currentUser) return;
      setLoading(true);

      try {
        const uid = auth.currentUser.uid;
        
        // Fetch counts for stats
        const collections = ['resumeAnalysis', 'quizSessions', 'emailDrafts', 'studyPlans', 'resumes', 'handwrittenAssignments'];
        const results = await Promise.all(
          collections.map(col => getDocs(query(collection(db, col), where('userId', '==', uid))))
        );

        setStats({
          analyses: results[0].size,
          quizzes: results[1].size,
          emails: results[2].size,
          studyPlans: results[3].size,
          resumes: results[4].size,
          handwritten: results[5].size
        });

        // Fetch recent activity across all
        const allActivity: any[] = [];
        results.forEach((snapshot, idx) => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            allActivity.push({
              id: doc.id,
              type: collections[idx],
              ...data,
              date: data.createdAt?.toDate() || new Date()
            });
          });
        });

        const sortedActivity = allActivity.sort((a, b) => b.date - a.date);
        setRecentActivity(sortedActivity.slice(0, 8));

        // Fetch AI Insights if there's activity
        if (sortedActivity.length > 0) {
          setIsInsightsLoading(true);
          try {
            const localInsights = localGenerateDashboardInsights(sortedActivity.slice(0, 5));
            setInsights(localInsights);
          } catch (aiErr) {
            console.error("Insights generation failed:", aiErr);
          } finally {
            setIsInsightsLoading(false);
          }
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleEngineChange = () => {
      setEngineMode(getAIEngineMode());
      setApiAvailable(isCloudApiKeyAvailable());
    };
    window.addEventListener('edutools_engine_changed', handleEngineChange);
    return () => window.removeEventListener('edutools_engine_changed', handleEngineChange);
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'resumeAnalysis': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'quizSessions': return <HelpCircle className="h-5 w-5 text-emerald-500" />;
      case 'emailDrafts': return <Mail className="h-5 w-5 text-indigo-500" />;
      case 'studyPlans': return <Sparkles className="h-5 w-5 text-amber-500" />;
      case 'resumes': return <Briefcase className="h-5 w-5 text-cyan-500" />;
      case 'handwrittenAssignments': return <BookOpen className="h-5 w-5 text-rose-500" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'resumeAnalysis': return 'CV Analysis';
      case 'quizSessions': return 'Quiz';
      case 'emailDrafts': return 'Email Draft';
      case 'studyPlans': return 'Study Plan';
      case 'resumes': return 'Professional Resume';
      case 'handwrittenAssignments': return 'Handwritten Assignment';
      default: return 'Activity';
    }
  };

  const chartData = [
    { name: 'Mon', count: 2 },
    { name: 'Tue', count: 5 },
    { name: 'Wed', count: 3 },
    { name: 'Thu', count: 7 },
    { name: 'Fri', count: 9 },
    { name: 'Sat', count: 4 },
    { name: 'Sun', count: 6 },
  ];

  const barData = [
    { name: 'CV', value: stats.analyses, color: '#2563eb' },
    { name: 'Quiz', value: stats.quizzes, color: '#10b981' },
    { name: 'Email', value: stats.emails, color: '#6366f1' },
    { name: 'Study', value: stats.studyPlans, color: '#f59e0b' },
    { name: 'Resume', value: stats.resumes, color: '#06b6d4' },
    { name: 'HW', value: stats.handwritten, color: '#f43f5e' },
  ];

  const getToolId = (type: string) => {
    switch(type) {
      case 'resumeAnalysis': return 'ats';
      case 'quizSessions': return 'quiz-gen';
      case 'emailDrafts': return 'email-gen';
      case 'studyPlans': return 'study-planner';
      case 'resumes': return 'resume-maker';
      case 'handwrittenAssignments': return 'handwritten-pro';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Syncing Academic Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#002366] p-2.5 rounded-2xl shadow-lg shadow-blue-900/10">
                <LayoutDashboard className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-medium bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm w-fit">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Welcome back, <span className="text-slate-900 font-black">{auth.currentUser?.displayName?.split(' ')[0] || 'Peer'}</span>!
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('toolkit')}
              className="bg-[#002366] text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center gap-3 group active:scale-95"
            >
              Launch Tool Kit <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Top Intelligence Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
          {/* AI Advisor Card */}
          <div className="lg:col-span-2 bg-[#002366] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl group border border-blue-900/50">
             <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000 hidden sm:block">
                <BrainCircuit className="h-64 w-64 md:h-80 md:w-80" />
             </div>
             
             <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-xl px-4 py-2 rounded-full text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-400/20 mb-6 md:mb-8">
                  <Zap className="h-3 w-3 fill-current" /> AI Growth Advisor
                </div>
                
                {isInsightsLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-10 bg-white/10 rounded-2xl w-3/4"></div>
                    <div className="h-20 bg-white/5 rounded-3xl w-full"></div>
                  </div>
                ) : insights ? (
                  <div className="space-y-6 md:space-y-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4 group-hover:text-blue-100 transition-colors">
                        {insights.mainInsight}
                      </h2>
                      <p className="text-blue-100/60 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
                        {insights.recommendation}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-sm">
                         <div className="h-10 w-10 md:h-12 md:w-12 bg-blue-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-300">
                           <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                         </div>
                         <div>
                            <div className="text-[9px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-0.5">Engagement</div>
                            <div className="text-xl md:text-2xl font-black">{insights.skillGrowth}%</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('toolkit')}
                        className="bg-white text-[#002366] px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20 text-sm md:text-base"
                      >
                         Take Action <ArrowUpRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-black mb-4">Start your educational journey.</h2>
                    <p className="text-blue-100/60 font-medium mb-8">Use any of our AI processing tools to receive personalized growth insights here.</p>
                  </div>
                )}
             </div>
          </div>

          {/* Activity Snapshot Card */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Focus Metrics</h3>
                <Target className="h-5 w-5 text-[#002366]" />
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
               <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Activities</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">
                    {stats.analyses + stats.quizzes + stats.emails + stats.studyPlans + stats.resumes + stats.handwritten}
                  </div>
               </div>
               <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
                 <Trophy className="h-6 w-6" />
               </div>
            </div>
          </div>
        </div>

        {/* Activity & Trends Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Recent Activity List */}
          <div className="lg:col-span-3 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Timeline</h3>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <div className="h-2 w-2 rounded-full bg-slate-100"></div>
                <div className="h-2 w-2 rounded-full bg-slate-100"></div>
              </div>
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
                <div key={activity.id} className="group p-5 rounded-[2rem] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      {getIcon(activity.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-slate-400 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-tight bg-white">
                          {getTypeLabel(activity.type)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold opacity-60 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 leading-none">
                        {activity.jobTitle || activity.topic || activity.purpose || activity.goal || activity.fullName || (activity.content ? activity.content.substring(0, 50) : 'Session Activity')}
                      </h4>
                      {activity.score !== undefined && (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-[2000ms] ${activity.score > 75 ? 'bg-emerald-500' : activity.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${activity.score}%` }}
                              ></div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${activity.score > 75 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {activity.score}% Result Score
                            </span>
                          </div>
                          
                          {activity.missingKeywords && activity.missingKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                               {activity.missingKeywords.slice(0, 3).map((kw: string, ki: number) => (
                                 <span key={ki} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">+{kw}</span>
                               ))}
                               {activity.missingKeywords.length > 3 && <span className="text-[9px] font-bold text-slate-400">+{activity.missingKeywords.length - 3} more</span>}
                            </div>
                          )}
                          
                          {activity.formattingTips && activity.formattingTips.length > 0 && (
                            <p className="text-[10px] text-slate-500 font-medium italic line-clamp-1 flex items-center gap-1.5">
                              <Briefcase className="h-3 w-3 text-blue-600" />
                              Tip: {activity.formattingTips[0]}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {activity.type === 'studyPlans' && activity.roadmapSummary && (
                        <p className="mt-3 text-xs text-slate-500 font-medium bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                          {activity.roadmapSummary}
                        </p>
                      )}

                      {activity.type === 'emailDrafts' && activity.tone && (
                        <div className="mt-2 flex items-center gap-2">
                           <span className="text-[10px] font-black text-[#002366] bg-blue-50 px-2 py-0.5 rounded uppercase">{activity.tone} Tone</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const toolId = getToolId(activity.type);
                      if (toolId) onSelectTool(toolId);
                    }}
                    className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-400 group-hover:bg-[#002366] group-hover:text-white group-hover:border-[#002366] transition-all flex items-center justify-center shadow-sm"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                   <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <AlertCircle className="h-8 w-8 text-slate-200" />
                   </div>
                   <h4 className="text-xl font-black text-slate-900 mb-2">No data yet</h4>
                   <p className="text-slate-400 font-medium max-w-xs mx-auto">Explore the tools to start tracking your academic and career growth.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Modules */}
          <div className="space-y-8">
            {/* Profile Mini Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                      {auth.currentUser?.photoURL ? (
                        <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{auth.currentUser?.displayName || 'Peer'}</h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-8">{auth.currentUser?.email?.split('@')[0]}</p>
                  
                  <div className="w-full h-px bg-slate-50 mb-8"></div>
                  
                  <div className="w-full space-y-5">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</span>
                       <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase border border-emerald-100">Verified Professional</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</span>
                       <span className="text-[10px] font-black text-slate-900 flex items-center gap-1.5">
                         <Calendar className="h-3.5 w-3.5 text-blue-600" /> Apr 2026
                       </span>
                    </div>
                  </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
