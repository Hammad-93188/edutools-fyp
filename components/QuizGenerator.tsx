
import React, { useState } from 'react';
import { HelpCircle, Book, Settings, Sparkles, CheckCircle2, XCircle, ChevronRight, Copy, RefreshCcw, BrainCircuit, FileDown, Download } from 'lucide-react';
import { generateQuiz } from '../services/gemini';
import { localGenerateQuiz } from '../services/localTools';
import { Question } from '../types';
import { jsPDF } from 'jspdf';
import { auth, saveUserActivity } from '../services/firebase';
import AIErrorAlert, { AIErrorType } from './AIErrorAlert';
import { classifyAIError } from '../services/errorUtils';

const QuizGenerator: React.FC = () => {
  const [inputType, setInputType] = useState<'topic' | 'text'>('topic');
  const [input, setInput] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<{ message: string, type: AIErrorType } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    setQuiz([]);
    setShowResults(false);
    setUserAnswers([]);

    try {
      // Try local bank first
      let result = localGenerateQuiz(input);
      
      // If the input is long (text based) or not in local bank (default generic questions), try AI
      // A "generic" local result usually has a specific question like "What is the most important part of..."
      const isGeneric = result[0].question.includes('most important part of');
      
      if (inputType === 'text' || (inputType === 'topic' && isGeneric)) {
        try {
          const aiResult = await generateQuiz(input, inputType, difficulty, questionCount);
          if (aiResult && aiResult.length > 0) result = aiResult;
        } catch (aiErr) {
          console.warn("AI Quiz generation failed, using local result.", aiErr);
        }
      }

      setQuiz(result);
      setUserAnswers(new Array(result.length).fill(null));
    } catch (err) {
      console.error(err);
      setError(classifyAIError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (qIdx: number, aIdx: number) => {
    if (showResults) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = aIdx;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, ans, idx) => {
      return ans === quiz[idx].correctAnswerIndex ? (score as number) + 1 : score;
    }, 0);
  };

  const submitQuiz = async () => {
    setShowResults(true);
    if (auth.currentUser && quiz.length > 0) {
      await saveUserActivity('quizSessions', {
        topic: input,
        score: calculateScore(),
        questionCount: quiz.length,
        questions: quiz, // Save the actual questions generated
        userAnswers: userAnswers,
        difficulty: difficulty,
        inputType: inputType
      });
    }
  };

  const reset = () => {
    setQuiz([]);
    setUserAnswers([]);
    setShowResults(false);
    setInput('');
  };

  const exportToPDF = () => {
    if (quiz.length === 0) return;
    const doc = new jsPDF();
    const title = inputType === 'topic' ? `Quiz: ${input}` : 'AI Generated Quiz';
    
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Difficulty: ${difficulty} | Date: ${new Date().toLocaleDateString()}`, 20, 30);
    
    let y = 45;
    quiz.forEach((q, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${q.question}`, 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      q.options.forEach((opt, oi) => {
        doc.text(`   [ ] ${opt}`, 25, y);
        y += 7;
      });
      y += 5;
    });

    // Add Answer Key
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Answer Key", 20, 20);
    y = 35;
    quiz.forEach((q, i) => {
      doc.setFontSize(11);
      doc.text(`${i + 1}. Correct Answer: ${q.options[q.correctAnswerIndex]}`, 20, y);
      y += 7;
      const splitExp = doc.splitTextToSize(`Explanation: ${q.explanation}`, 170);
      doc.text(splitExp, 20, y);
      y += (splitExp.length * 6) + 5;
    });

    doc.save(`EduTools_Quiz_${input.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex p-3 bg-emerald-100 rounded-2xl mb-4">
          <BrainCircuit className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-4xl font-extrabold text-[#002366] mb-2 tracking-tight">AI Quiz Master</h2>
        <p className="text-gray-500">Generate professional assessments from any topic or text.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 sticky top-24">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Quiz Configuration</h3>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputType('topic')}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${inputType === 'topic' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  By Topic
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('text')}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${inputType === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  By Text
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                  {inputType === 'topic' ? 'Focus Topic' : 'Source Content'}
                </label>
                {inputType === 'topic' ? (
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. Modern Physics"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    required
                  />
                ) : (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm h-32 resize-none"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Questions</label>
                  <select 
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  >
                    {[3, 5, 10, 15].map(n => <option key={n} value={n}>{n} MCQs</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Level</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  >
                    {['Easy', 'Intermediate', 'Advanced'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
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
                disabled={isLoading || !input.trim()}
                className="w-full bg-[#002366] text-white py-4 rounded-2xl font-black hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {isLoading ? 'Synthesizing...' : 'Generate Quiz'}
              </button>
            </form>

            {quiz.length > 0 && (
              <button 
                onClick={exportToPDF}
                className="w-full mt-4 border-2 border-slate-200 text-slate-700 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <FileDown className="h-5 w-5" /> Export as PDF
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {quiz.length > 0 ? (
            <div className="space-y-8">
              {quiz.map((q, qIdx) => (
                <div key={qIdx} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all">
                  <div className="flex gap-4 mb-6">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-xs">
                      {qIdx + 1}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 leading-relaxed">{q.question}</h4>
                  </div>
                  
                  <div className="grid gap-3">
                    {q.options.map((opt, aIdx) => {
                      const isSelected = userAnswers[qIdx] === aIdx;
                      const isCorrect = q.correctAnswerIndex === aIdx;
                      const isWrong = isSelected && !isCorrect;

                      let btnStyle = "bg-gray-50 border-gray-100 hover:border-blue-200 text-gray-700";
                      if (showResults) {
                        if (isCorrect) btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-700";
                        else if (isWrong) btnStyle = "bg-red-50 border-red-500 text-red-700";
                        else btnStyle = "bg-gray-50 border-gray-100 opacity-50";
                      } else if (isSelected) {
                        btnStyle = "bg-blue-600 border-blue-600 text-white shadow-lg";
                      }

                      return (
                        <button
                          key={aIdx}
                          onClick={() => selectAnswer(qIdx, aIdx)}
                          disabled={showResults}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between ${btnStyle}`}
                        >
                          {opt}
                          {showResults && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                          {showResults && isWrong && <XCircle className="h-5 w-5 text-red-500" />}
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <HelpCircle className="h-3.5 w-3.5" /> Explanation
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}

              {!showResults ? (
                <div className="bg-[#002366] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-xl">
                  <div>
                    <h4 className="text-xl font-black mb-1">Ready to check?</h4>
                    <p className="text-blue-200 text-sm">Review your answers before submitting the quiz.</p>
                  </div>
                  <button 
                    onClick={submitQuiz}
                    className="bg-white text-[#002366] px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-50 transition-all active:scale-95"
                  >
                    Finish & Show Results
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm text-center min-w-[100px]">
                      <span className="text-4xl font-black">{calculateScore()}</span>
                      <span className="text-sm opacity-60 ml-1">/ {quiz.length}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black mb-1">Quiz Completed!</h4>
                      <p className="text-emerald-50 opacity-80 text-sm">You've successfully finished this assessment.</p>
                    </div>
                  </div>
                  <button 
                    onClick={reset}
                    className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <RefreshCcw className="h-5 w-5" /> Start New Quiz
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
               <div className="bg-gray-50 p-6 rounded-full mb-6">
                 <HelpCircle className="h-12 w-12 text-gray-200" />
               </div>
               <h3 className="text-xl font-bold text-gray-400 mb-2">No Quiz Active</h3>
               <p className="text-gray-400 text-sm max-w-xs">Configure the settings on the left to generate your interactive assessment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;
