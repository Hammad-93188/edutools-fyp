import React, { useState, useRef } from 'react';
import {
  FileText, Upload, CheckCircle, AlertCircle, RefreshCcw,
  Briefcase, Sparkles, Info, ShieldCheck, Loader2,
  ClipboardPaste, TrendingUp, XCircle, Zap, Star, Target
} from 'lucide-react';
import { auth, saveUserActivity } from '../services/firebase';
import { analyzeResume } from '../services/gemini';
import AIErrorAlert, { AIErrorType } from './AIErrorAlert';
import { classifyAIError } from '../services/errorUtils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface AnalysisResult {
  score: number;
  experienceLevel: string;
  summary: string;
  strengths: string[];
  keywordsFound: string[];
  missingKeywords: string[];
  atsIssues: string[];
  improvementSteps: string[];
  formattingTips: string[];
}

const CVAnalyzer: React.FC = () => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<{ message: string; type: AIErrorType } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const extractText = async (f: File): Promise<string> => {
    const ext = f.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const text = e.target?.result as string;
          if (!text || text.trim().length < 50) reject(new Error('File contains too little text.'));
          else resolve(text);
        };
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsText(f);
      });
    }

    if (ext === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const buffer = await f.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        if (!result.value || result.value.trim().length < 50)
          throw new Error('Could not extract text from this DOCX file.');
        return result.value;
      } catch {
        throw new Error('DOCX extraction failed. Try saving the file as TXT and re-uploading, or use the "Paste Text" tab.');
      }
    }

    if (ext === 'pdf') {
      throw new Error('PDF text extraction is not supported in the browser. Please copy your CV text and use the "Paste Text" tab instead.');
    }

    throw new Error('Unsupported file type. Upload TXT or DOCX, or paste your CV text directly.');
  };

  const handleFileSelect = (f: File) => {
    setError(null);
    if (f.size > MAX_FILE_SIZE) {
      setError({ message: 'File exceeds 5 MB limit.', type: 'file' });
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const startScan = async () => {
    if (!jobTitle.trim()) return;
    if (inputMode === 'upload' && !file) return;
    if (inputMode === 'paste' && !pastedText.trim()) return;

    setIsScanning(true);
    setError(null);

    try {
      let resumeText = '';

      if (inputMode === 'paste') {
        resumeText = pastedText.trim();
        if (resumeText.length < 50)
          throw new Error('Please paste more resume content (at least a few sentences).');
      } else {
        resumeText = await extractText(file!);
      }

      const aiResult = await analyzeResume(resumeText, jobTitle);

      if (!aiResult || typeof aiResult.score !== 'number')
        throw new Error('Analysis returned an unexpected result. Please try again.');

      setResults(aiResult);

      if (auth.currentUser) {
        await saveUserActivity('resumeAnalysis', {
          jobTitle,
          score: aiResult.score,
          missingKeywords: aiResult.missingKeywords,
          formattingTips: aiResult.formattingTips
        });
      }
    } catch (err: any) {
      setError(classifyAIError(err));
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPastedText('');
    setResults(null);
    setJobTitle('');
    setError(null);
  };

  const scoreColor = (s: number) =>
    s >= 75 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-red-500';

  const scoreBg = (s: number) =>
    s >= 75 ? 'bg-emerald-50 border-emerald-200' : s >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const levelColor: Record<string, string> = {
    Junior: 'bg-blue-100 text-blue-700',
    'Mid-Level': 'bg-purple-100 text-purple-700',
    Senior: 'bg-emerald-100 text-emerald-700',
    Executive: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-[#002366] mb-2 tracking-tight">ATS CV Analyzer</h2>
        <p className="text-gray-500 font-medium">AI-powered resume analysis — get your score, missing keywords, and a prioritised action plan.</p>
      </div>

      {!results && !isScanning && (
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100">

          {/* Input mode tabs */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl mb-8 w-fit">
            <button
              onClick={() => { setInputMode('upload'); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${inputMode === 'upload' ? 'bg-white text-[#002366] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Upload className="h-4 w-4" /> Upload File
            </button>
            <button
              onClick={() => { setInputMode('paste'); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${inputMode === 'paste' ? 'bg-white text-[#002366] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ClipboardPaste className="h-4 w-4" /> Paste Text
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">

            {/* Left: file drop or paste */}
            {inputMode === 'upload' ? (
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-blue-50/50 hover:border-blue-400'}`}
              >
                <Upload className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700 mb-1">Drag & drop your CV here</p>
                <p className="text-xs text-gray-400 mb-5">TXT or DOCX · Max 5 MB · PDF → use Paste Text</p>
                <input type="file" id="cv-upload" className="hidden" accept=".docx,.txt" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                <label htmlFor="cv-upload" className="bg-white text-[#002366] border-2 border-[#002366] px-6 py-2.5 rounded-2xl text-sm font-black cursor-pointer hover:bg-blue-50 transition-all inline-block">
                  {file ? 'Change File' : 'Browse'}
                </label>
                {file && (
                  <div className="mt-5 flex items-center justify-center gap-2 text-blue-700 bg-white py-2.5 px-4 rounded-xl text-xs font-bold border border-blue-100">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> {file.name}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Paste CV / Resume Text</p>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Paste your full resume or CV text here. Works great for PDF — just open it, select all, and paste."
                  rows={10}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 resize-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {pastedText.length > 0 ? `${pastedText.length} characters` : 'Tip: open your PDF, press Ctrl+A, then Ctrl+C, then paste here.'}
                </p>
              </div>
            )}

            {/* Right: job title + scan */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-2 ml-1">Target Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startScan()}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {error && <AIErrorAlert error={error} onRetry={startScan} />}

              <button
                onClick={startScan}
                disabled={!jobTitle.trim() || (inputMode === 'upload' ? !file : !pastedText.trim())}
                className="w-full bg-[#002366] text-white py-4 rounded-2xl font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Sparkles className="h-5 w-5" /> Analyze with AI
              </button>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Target, label: 'ATS Score' },
                  { icon: Zap, label: 'Action Plan' },
                  { icon: Star, label: 'Strengths' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                    <Icon className="h-4 w-4 text-[#002366] mx-auto mb-1" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick examples */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick-start examples</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Software Engineer', job: 'Senior Frontend Developer', text: 'John Doe. Software Engineer with 5 years of experience in React, Node.js, and TypeScript. Developed multiple scalable web applications. Strong problem-solving skills and team collaboration. Experience with AWS, Docker, and CI/CD pipelines. Education: BSc Computer Science.' },
                { title: 'Project Manager', job: 'Technical Project Manager', text: 'Jane Smith. Project Manager with 8 years of experience in Agile methodologies, Scrum, and team leadership. Successfully delivered 20+ projects on time and within budget. PMP certified. Expert in Jira, Trello, and stakeholder management. Education: MBA.' },
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setInputMode('paste'); setPastedText(ex.text); setJobTitle(ex.job); setError(null); }}
                  className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                >
                  <div className="h-9 w-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{ex.title}</p>
                    <p className="text-[11px] text-gray-400 font-medium">→ {ex.job}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="bg-white rounded-[3rem] p-16 text-center shadow-xl border border-blue-50">
          <div className="relative mx-auto h-20 w-20 mb-8">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-[#002366] mb-2">Analyzing your CV</h3>
          <p className="text-gray-400 font-medium text-sm">Running ATS check for <span className="text-[#002366] font-bold">"{jobTitle}"</span>…</p>
        </div>
      )}

      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Header: score + summary */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.04] pointer-events-none"><Sparkles className="h-64 w-64 text-blue-600" /></div>

            <div className="relative h-44 w-44 flex-shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100" />
                <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="10" fill="transparent"
                  strokeDasharray={478} strokeDashoffset={478 - (results.score / 100) * 478}
                  strokeLinecap="round" className={`${scoreColor(results.score)} transition-all duration-[1500ms] ease-out`} />
              </svg>
              <div className="absolute text-center">
                <div className={`text-5xl font-black ${scoreColor(results.score)}`}>{results.score}</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">ATS Score</div>
              </div>
            </div>

            <div className="flex-1 z-10">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${levelColor[results.experienceLevel] || 'bg-gray-100 text-gray-600'}`}>
                  {results.experienceLevel}
                </span>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${scoreBg(results.score)}`}>
                  {results.score >= 75 ? 'Strong Match' : results.score >= 50 ? 'Moderate Match' : 'Needs Work'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">AI Analysis Complete</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-sm mb-5">{results.summary}</p>
              <button onClick={reset} className="flex items-center gap-2 text-sm font-black text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-all">
                <RefreshCcw className="h-4 w-4" /> Analyze another CV
              </button>
            </div>
          </div>

          {/* Top 3 Improvement Steps */}
          {results.improvementSteps?.length > 0 && (
            <div className="bg-[#002366] rounded-[2.5rem] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/10 p-2.5 rounded-xl"><Zap className="h-5 w-5 text-blue-300" /></div>
                <h4 className="text-base font-black uppercase tracking-widest">Top 3 Actions This Week</h4>
              </div>
              <div className="space-y-3">
                {results.improvementSteps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                    <span className="text-2xl font-black text-blue-400 leading-none mt-0.5 w-6 flex-shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium text-blue-100 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {results.keywordsFound?.length > 0 && (
              <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" /> Keywords Found
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.keywordsFound.map((kw, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Missing Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.missingKeywords.map((kw, i) => (
                  <span key={i} className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full text-xs font-bold">+ {kw}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths + ATS Issues */}
          <div className="grid md:grid-cols-2 gap-6">
            {results.strengths?.length > 0 && (
              <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-500" /> Your Strengths
                </h4>
                <ul className="space-y-3">
                  {results.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.atsIssues?.length > 0 && (
              <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-red-50">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" /> ATS Issues Found
                </h4>
                <ul className="space-y-3">
                  {results.atsIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Formatting Tips */}
          {results.formattingTips?.length > 0 && (
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" /> Formatting Tips
              </h4>
              <ul className="grid sm:grid-cols-2 gap-3">
                {results.formattingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium bg-gray-50 rounded-xl p-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default CVAnalyzer;
