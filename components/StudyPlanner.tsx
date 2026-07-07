
import React, { useState } from 'react';
import { Calendar, Clock, Target, Sparkles, RefreshCcw, CheckCircle, BookOpen, ListTodo, GraduationCap, ArrowRight } from 'lucide-react';
import { generateStudyPlan } from '../services/gemini';
import { localGenerateStudyPlan } from '../services/localTools';
import { auth, saveUserActivity } from '../services/firebase';
import AIErrorAlert, { AIErrorType } from './AIErrorAlert';
import { classifyAIError } from '../services/errorUtils';

interface StudyPlan {
  title: string;
  overview: string;
  roadmapSummary: string;
  phases: {
    phaseName: string;
    duration: string;
    focus: string;
    tasks: string[];
    resources: string[];
  }[];
  tips: string[];
  resources: string[];
}

const StudyPlanner: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [currentLevel, setCurrentLevel] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<{ message: string, type: AIErrorType } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !timeframe) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      // Try local blueprint first
      let result = localGenerateStudyPlan(goal) as StudyPlan;
      
      // If the goal is highly specialized or not in basic local blueprints, try AI
      const isGeneric = result.title.includes('Path to');
      if (goal.split(' ').length > 4 || isGeneric) {
        try {
          const aiPlan = await generateStudyPlan(goal, timeframe, dailyHours, currentLevel);
          if (aiPlan && aiPlan.phases) result = aiPlan;
        } catch (aiErr) {
          console.warn("AI Study Plan generation failed, using local result.", aiErr);
        }
      }

      setPlan(result);
      
      // Save if logged in
      if (auth.currentUser && result) {
        await saveUserActivity('studyPlans', {
          goal,
          timeframe,
          dailyHours,
          currentLevel,
          plan: result,
          roadmapSummary: result.roadmapSummary || result.overview.substring(0, 100)
        });
      }
    } catch (err) {
      console.error(err);
      setError(classifyAIError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setPlan(null);
    setGoal('');
    setTimeframe('');
    setDailyHours(2);
    setCurrentLevel('Beginner');
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-[#002366] mb-4 tracking-tight">Advanced Study Planner</h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-medium">
          AI-driven scheduling that adapts to your learning pace, goals, and deadlines.
        </p>
      </div>

      {!plan && !isGenerating && (
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
          <form onSubmit={handleGenerate} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Learning Goal</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Master React.js & TypeScript"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Timeframe</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                    <input
                      type="text"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      placeholder="e.g. 3 Months, 6 Weeks"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Daily Commitment (Hours)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(parseInt(e.target.value))}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Current Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCurrentLevel(level)}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                          currentLevel === level 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <AIErrorAlert 
                error={error} 
                onRetry={() => handleGenerate({ preventDefault: () => {} } as any)}
              />
            )}

            <button
              type="submit"
              className="w-full bg-[#002366] text-white py-5 rounded-[2rem] font-black text-lg hover:bg-blue-800 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group"
            >
              <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              Generate Personalized Roadmap
            </button>
          </form>
        </div>
      )}

      {isGenerating && (
        <div className="bg-white rounded-[3rem] p-16 text-center shadow-xl border border-blue-50 animate-pulse">
          <div className="relative mx-auto h-24 w-24 mb-8">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <GraduationCap className="absolute inset-0 m-auto h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-[#002366] mb-2 tracking-tight">Architecting Your Study Plan</h3>
          <p className="text-gray-500 font-medium italic">Building local roadmap for "{goal}"...</p>
        </div>
      )}

      {plan && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Plan Header */}
          <div className="bg-[#002366] rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Target className="h-64 w-64" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-blue-500/30 backdrop-blur-md px-4 py-1.5 rounded-full text-blue-200 text-[10px] font-black uppercase tracking-widest border border-blue-400/30 mb-6">
                <Sparkles className="h-3 w-3" /> AI-Generated Strategy
              </div>
              <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">{plan.title}</h3>
              <p className="text-blue-100/80 text-lg font-medium max-w-3xl leading-relaxed mb-4">
                {plan.overview}
              </p>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-8">
                <p className="text-sm font-bold text-blue-200 italic">
                  " {plan.roadmapSummary} "
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Duration</div>
                    <div className="font-bold">{timeframe}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Daily Effort</div>
                    <div className="font-bold">{dailyHours} Hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Roadmap */}
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 overflow-x-auto">
            <h4 className="text-xl font-black text-[#002366] mb-8 flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" /> Strategic Roadmap
            </h4>
            <div className="flex items-start min-w-[600px] relative pb-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-100 -translate-y-1/2 z-0"></div>
              {plan.phases.map((phase, idx) => (
                <div key={idx} className="flex-1 relative z-10 flex flex-col items-center px-2">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black mb-4 shadow-lg shadow-blue-500/30 border-4 border-white">
                    {idx + 1}
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{phase.duration}</div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-2">{phase.phaseName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phases Grid */}
          <div className="grid gap-8">
            {plan.phases.map((phase, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-10 hover:border-blue-200 transition-all group">
                <div className="md:w-1/3">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-sm">
                      {idx + 1}
                    </span>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{phase.phaseName}</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                      <Clock className="h-4 w-4" /> {phase.duration}
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      {phase.focus}
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-slate-50 rounded-3xl p-6 md:p-8">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-blue-500" /> Milestone Tasks
                  </h5>
                  <ul className="grid sm:grid-cols-2 gap-4 mb-8">
                    {phase.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-3 text-sm text-slate-700 font-bold leading-tight group/item">
                        <div className="h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:border-blue-500 group-hover/item:bg-blue-50 transition-all">
                          <CheckCircle className="h-3 w-3 text-transparent group-hover/item:text-blue-500" />
                        </div>
                        {task}
                      </li>
                    ))}
                  </ul>

                  {phase.resources && phase.resources.length > 0 && (
                    <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-5">
                      <h6 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Recommended phase resources
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {phase.resources.map((res, rIdx) => (
                          <div key={rIdx} className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                             {res}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tips & Resources */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <h4 className="text-xl font-black text-[#002366] mb-8 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-amber-500" /> Expert Study Tips
              </h4>
              <div className="space-y-6">
                {plan.tips.map((tip, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 flex-shrink-0"></div>
                    <p className="text-slate-600 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <h4 className="text-xl font-black text-[#002366] mb-8 flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-blue-500" /> Recommended Resources
              </h4>
              <div className="grid gap-4">
                {plan.resources.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-blue-50 rounded-2xl border border-blue-100 group hover:bg-blue-600 transition-all cursor-default">
                    <span className="font-bold text-blue-800 group-hover:text-white transition-colors">{res}</span>
                    <ArrowRight className="h-5 w-5 text-blue-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-gray-900 rounded-[3rem] p-10 text-center text-white">
            <h4 className="text-2xl font-black mb-4">Ready to start your journey?</h4>
            <p className="text-slate-400 font-medium mb-8 max-w-xl mx-auto">
              This plan is a starting point. Consistency is key to mastering {goal}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button onClick={() => window.print()} className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all">
                  Export as PDF
               </button>
               <button onClick={reset} className="w-full sm:w-auto bg-white/10 text-white px-8 py-4 rounded-2xl font-black hover:bg-white/20 transition-all">
                  Create New Plan
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
