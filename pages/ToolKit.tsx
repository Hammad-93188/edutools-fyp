
import React from 'react';
import { 
  PenTool, 
  FileSearch, 
  Mail, 
  ArrowRight, 
  BrainCircuit, 
  Zap,
  Sparkles,
  ShieldCheck,
  Clock,
  GraduationCap,
  Layout
} from 'lucide-react';

interface ToolKitProps {
  onSelectTool: (toolId: string) => void;
}

const ToolKit: React.FC<ToolKitProps> = ({ onSelectTool }) => {
  const tools = [
    {
      id: 'handwritten',
      title: 'Handwrite AI',
      shortDesc: 'Digital to Human script.',
      desc: 'Our flagship engine that turns typed text into hyper-realistic human handwriting. Perfect for high-quality assignments and letters.',
      icon: PenTool,
      accent: 'blue',
      badge: 'Popular',
      features: ['8+ Natural Styles', 'HD PNG/PDF Export', 'No Data Logged']
    },
    {
      id: 'ats',
      title: 'ATS CV Analyzer',
      shortDesc: 'Optimize for hiring bots.',
      desc: 'Expert-level resume scanning. Cross-reference your CV against job descriptions to identify missing keywords and formatting errors.',
      icon: FileSearch,
      accent: 'indigo',
      badge: 'Career',
      features: ['Keyword Gap Analysis', 'ATS Score (1-10)', 'Format Audit']
    },
    {
      id: 'quiz-gen',
      title: 'Quiz Master',
      shortDesc: 'Instant assessment creator.',
      desc: 'A powerful tool for educators. Generate structured multiple-choice questions from any topic or raw text in seconds.',
      icon: BrainCircuit,
      accent: 'emerald',
      badge: 'Education',
      features: ['Auto-Explanations', 'Difficulty Control', 'LMS Export']
    },
    {
      id: 'study-planner',
      title: 'Study Planner',
      shortDesc: 'AI-driven milestone roadmap.',
      desc: 'Architect your academic success. Generate personalized study schedules that adapt to your goals, timeframe, and daily availability.',
      icon: GraduationCap,
      accent: 'purple',
      badge: 'New',
      features: ['Milestone Phases', 'Resource Mapping', 'Exportable PDF']
    },
    {
      id: 'email-gen',
      title: 'AI Emailer',
      shortDesc: 'Draft with perfect tone.',
      desc: 'Context-aware professional email drafting. Adjust tone, language, and purpose to create the perfect response every time.',
      icon: Mail,
      accent: 'cyan',
      badge: 'Productivity',
      features: ['Tone Shifting', 'Pro Templates', 'Multi-lingual']
    },
    {
      id: 'resume-maker',
      title: 'Resume Maker',
      shortDesc: 'ATS-proof CV creator.',
      desc: 'Build a high-performance resume in minutes. No AI needed - select from 10 professional, ATS-optimized templates and export as PDF.',
      icon: Layout,
      accent: 'rose',
      badge: 'New',
      features: ['10+ Pro Templates', 'ATS Optimized', 'Local PDF Export']
    }
  ];

  const getAccentColors = (color: string) => {
    const map: any = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-100' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-100' },
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-100' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-100' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-100' },
      rose: { bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50', border: 'border-rose-100' }
    };
    return map[color] || map.blue;
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4 md:px-8">
      <div className="mb-20 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight text-center">
          Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI Utility Kit</span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium mb-12 leading-relaxed text-center max-w-2xl">
          Everything you need for academic and career excellence, <br className="hidden md:block" /> 
          powered by next-gen Gemini AI.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
        {tools.map((tool) => {
          const colors = getAccentColors(tool.accent);
          return (
            <div 
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col hover:-translate-y-2"
            >
              <div className="p-10 flex flex-col h-full relative">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 rounded-2xl ${colors.light} ${colors.text} transition-transform group-hover:scale-110 duration-500`}>
                    <tool.icon className="h-8 w-8" />
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${colors.border} ${colors.text} bg-white`}>
                    {tool.badge}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-3xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {tool.desc}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-10">
                  {tool.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400" />
                  <div className={`flex items-center gap-2 font-black text-sm ${colors.text} group-hover:translate-x-1 transition-transform`}>
                    Launch <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ToolKit;
