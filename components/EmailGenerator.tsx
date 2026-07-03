
import React, { useState } from 'react';
import { Send, Copy, Languages, Check, Sparkles, ClipboardList, Mail, Lock } from 'lucide-react';
import { generateEmail, translateText } from '../services/gemini';
import { localGenerateEmail } from '../services/localTools';
import { auth, saveUserActivity } from '../services/firebase';
import AIErrorAlert, { AIErrorType } from './AIErrorAlert';
import { classifyAIError } from '../services/errorUtils';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ur', name: 'Urdu' },
];

const emailTemplates = [
  { label: 'Interview Follow-up', purpose: 'Follow up after an interview for a Software Engineer position.' },
  { label: 'Networking Outreach', purpose: 'Reach out to a professional in the AI industry to connect and share insights.' },
  { label: 'Internship Application', purpose: 'Expression of interest for a summer internship in Web Development.' },
  { label: 'Salary Negotiation', purpose: 'Professionally negotiate the salary offer for a new role based on market research.' },
  { label: 'Resignation Letter', purpose: 'Formal resignation from current position with a two-week notice and gratitude.' },
  { label: 'Recommendation Request', purpose: 'Ask a former manager or professor for a professional letter of recommendation.' },
  { label: 'Referral Request', purpose: 'Ask a connection for a referral to a specific job opening at their company.' },
  { label: 'Informational Interview', purpose: 'Request a brief meeting to learn about a professional\'s career path and industry insights.' },
  { label: 'Post-Event Connection', purpose: 'Follow up with someone met at a conference or networking event.' },
  { label: 'Inquiry on Job Status', purpose: 'Check in on the status of a job application after a period of no contact.' },
  { label: 'Thank You after Meeting', purpose: 'Express appreciation for someone\'s time after a networking or coffee chat.' },
  { label: 'Freelance Pitch', purpose: 'A cold outreach email pitching freelance services like design or writing to a potential client.' },
  { label: 'Professor Meeting', purpose: 'Request a meeting with a professor during office hours to discuss course topics or research.' },
  { label: 'Accepting Job Offer', purpose: 'Formal acceptance of a job offer, confirming start date and next steps.' },
  { label: 'Declining Job Offer', purpose: 'Professionally decline a job offer while maintaining a positive relationship.' },
  { label: 'Feedback Request', purpose: 'Ask for constructive feedback after being rejected from a role to improve for future opportunities.' },
  { label: 'Project Update', purpose: 'Send a status update to a client or manager regarding the progress of an ongoing project.' },
  { label: 'Sick Leave Request', purpose: 'Notify manager of an unexpected illness and inability to work for the day.' },
  { label: 'Promotion Request', purpose: 'Ask for a meeting to discuss achievements and the possibility of a promotion or raise.' },
  { label: 'Meeting Reschedule', purpose: 'Politely request to reschedule a planned meeting due to a conflict.' },
];

const EmailGenerator: React.FC = () => {
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('English');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ message: string, type: AIErrorType } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) return;
    setIsLoading(true);
    setError(null);
    try {
      // First, try to generate locally if it matches common templates
      let email = localGenerateEmail(purpose, tone);
      
      // If the purpose is complex or very custom (e.g. > 10 words and doesn't match local templates), use AI
      if (purpose.split(' ').length > 15 && !email.includes('RE:')) {
        try {
          const aiEmail = await generateEmail(purpose, tone, language);
          if (aiEmail) email = aiEmail;
        } catch (aiErr) {
          console.warn("AI Email generation failed, using local template.", aiErr);
        }
      }

      setResult(email || '');
      
      // Save if logged in
      if (auth.currentUser && email) {
        await saveUserActivity('emailDrafts', {
          purpose,
          tone,
          language,
          content: email
        });
      }
    } catch (err) {
      console.error(err);
      setError(classifyAIError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (targetLang: string) => {
    if (!result) return;
    setIsTranslating(true);
    try {
      const translated = await translateText(result, targetLang);
      setResult(translated || '');
      setLanguage(targetLang);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (tmplPurpose: string) => {
    setPurpose(tmplPurpose);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-[#002366] mb-2 tracking-tight">AI Email Generator</h2>
        <p className="text-gray-600">Draft professional emails in any language with perfect tone.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full max-h-[700px] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600" /> Quick Templates
            </h3>
            <div className="flex flex-col gap-2">
              {emailTemplates.map((tmpl, idx) => (
                <button key={idx} onClick={() => applyTemplate(tmpl.purpose)} className="text-left text-xs p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-700 font-medium">
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" /> Purpose of the Email
                  </label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe what you want to say..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-48 transition-all text-sm resize-none"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tone</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    >
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Urgent</option>
                      <option>Friendly</option>
                      <option>Formal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Initial Language</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.name}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <AIErrorAlert 
                  error={error} 
                  onRetry={() => handleGenerate({ preventDefault: () => {} } as any)}
                />
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg active:scale-95">
                {isLoading ? 'Generating Draft...' : 'Generate Email'}
              </button>
            </form>
          </div>

          <div className="bg-[#f8fafc] rounded-3xl p-8 border border-gray-100 relative min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-[#002366] flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" /> Generated Draft
              </h3>
              {result && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                    <Languages className="h-4 w-4 text-blue-500" />
                    <select 
                      onChange={(e) => handleTranslate(e.target.value)}
                      disabled={isTranslating}
                      className="text-xs font-bold text-gray-600 outline-none bg-transparent cursor-pointer disabled:opacity-50"
                      defaultValue=""
                    >
                      <option value="" disabled>Translate to...</option>
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.name}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600 shadow-sm"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </div>

            {isTranslating && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-blue-600">Translating...</p>
                </div>
              </div>
            )}

            {result ? (
              <div className="flex-1 bg-white rounded-2xl p-8 border border-gray-100 text-gray-800 text-base whitespace-pre-wrap leading-relaxed shadow-inner">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-20">
                <Mail className="h-12 w-12 text-gray-200 mb-4" />
                <p className="font-medium">Your generated email will appear here.</p>
                <p className="text-xs mt-2">Fill in the purpose and click generate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailGenerator;
