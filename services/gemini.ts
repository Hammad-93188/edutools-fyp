import { GoogleGenAI, Type } from "@google/genai";
import { 
  localAnalyzeResume, 
  localGenerateEmail, 
  localGenerateStudyPlan, 
  localGenerateQuiz, 
  localSummarizeResearch, 
  localChatWithEduBot, 
  localGenerateDashboardInsights 
} from "./localTools";

// --- DUAL-ENGINE ARCHITECTURE UTILS ---

export const getAIEngineMode = (): 'auto' | 'local' => {
  return (localStorage.getItem('edutools_ai_engine') as 'auto' | 'local') || 'auto';
};

export const setAIEngineMode = (mode: 'auto' | 'local') => {
  localStorage.setItem('edutools_ai_engine', mode);
  window.dispatchEvent(new Event('edutools_engine_changed'));
};

export const isCloudApiKeyAvailable = (): boolean => {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
};

export const getActiveEngineLabel = (): string => {
  const mode = getAIEngineMode();
  if (mode === 'local') {
    return 'Local Heuristic Engine (Forced Offline Mode)';
  }
  return isCloudApiKeyAvailable() 
    ? 'Cloud Live Engine (Gemini Pro/Flash via API)' 
    : 'Local Heuristic Engine (Auto-Fallback active)';
};

export const shouldFallback = (): boolean => {
  if (getAIEngineMode() === 'local') {
    return true;
  }
  return !isCloudApiKeyAvailable();
};

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Auto-routing to Local Heuristic Engine.");
    throw new Error("Gemini API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const isGeminiServiceUnavailableError = (err: any): boolean => {
  const text = [
    err?.message,
    err?.error?.message,
    err?.status,
    err?.error?.status,
    err?.code,
    err?.error?.code,
    typeof err === 'string' ? err : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /(503|unavailable|temporarily unavailable|high demand|overloaded|try again later)/i.test(text);
};

// --- ROUTED SERVICES ---

export const generateEmail = async (purpose: string, tone: string, language: string) => {
  if (shouldFallback()) {
    console.log("Dual-Engine Router: Routing generateEmail to Local Engine");
    const localEmail = localGenerateEmail(purpose, tone);
    if (language !== 'English') {
      return `[Heuristic System Translate: ${language}]\n\n${localEmail}`;
    }
    return localEmail;
  }

  const ai = getAI();
  const prompt = `Act as a professional communications expert.
  Write a high-quality email in ${language}.
  
  PURPOSE: ${purpose}
  TONE: ${tone}
  
  STRUCTURE:
  - Professional Subject Line
  - Appropriate Salutation
  - Body with placeholders like [Name] or [Date] where necessary
  - Professional Closing
  
  Ensure the grammar is native-level and the etiquette matches the ${tone} tone. 
  Respond ONLY with the email content.`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
  });

  return response.text;
};

export const summarizeResearch = async (text: string, depth: 'Executive' | 'Bulleted' | 'Deep Dive') => {
  if (shouldFallback()) {
    console.log("Dual-Engine Router: Routing summarizeResearch to Local Engine");
    return localSummarizeResearch(text, depth);
  }

  const ai = getAI();
  const prompt = `Act as an expert academic researcher. Summarize the following document with "${depth}" depth.
  
  DOCUMENT TEXT: ${text}
  
  Provide a JSON response with:
  1. summaryText: A cohesive summary of the text.
  2. keyInsights: An array of the 5 most important takeaways.
  3. suggestedReading: An array of 3 topics the user should research next based on this content.`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summaryText: { type: Type.STRING },
          keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedReading: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summaryText", "keyInsights", "suggestedReading"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeResume = async (resumeText: string, jobTitle: string) => {
  if (shouldFallback()) {
    return localAnalyzeResume(resumeText, jobTitle);
  }

  const ai = getAI();
  const prompt = `You are a senior ATS (Applicant Tracking System) specialist and career coach.
Analyze the resume below for the target role and return a detailed JSON evaluation.

TARGET ROLE: ${jobTitle}
RESUME TEXT:
${resumeText}

Be specific and actionable. Base every observation strictly on what is or isn't in the resume text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      systemInstruction: 'You are an expert ATS analyst. Return only valid JSON matching the schema. Be specific, honest, and actionable. Never invent information not present in the resume.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: 'ATS match score 0-100' },
          experienceLevel: { type: Type.STRING, description: 'One of: Junior, Mid-Level, Senior, Executive' },
          summary: { type: Type.STRING, description: 'Two-sentence overall assessment of the resume for this role' },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-5 specific things the candidate does well' },
          keywordsFound: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Relevant skills and keywords already present in the resume' },
          missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: '6-10 high-value keywords for this role that are missing' },
          atsIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific ATS-breaking problems found (tables, graphics, headers, file format issues)' },
          improvementSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Top 3 prioritised actions to take this week to improve the score' },
          formattingTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Layout and formatting advice specific to ATS parsing' }
        },
        required: ['score', 'experienceLevel', 'summary', 'strengths', 'keywordsFound', 'missingKeywords', 'atsIssues', 'improvementSteps', 'formattingTips']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateQuiz = async (input: string, type: 'topic' | 'text', difficulty: string, count: number) => {
  if (shouldFallback()) {
    console.log("Dual-Engine Router: Routing generateQuiz to Local Engine");
    const basicQuiz = localGenerateQuiz(input);
    // Expand to match count if necessary
    if (basicQuiz.length < count) {
      const extra: any[] = [];
      for (let i = basicQuiz.length; i < count; i++) {
        extra.push({
          question: `Self-Assessment Question #${i + 1} regarding ${input}.`,
          options: ['Essential Practice', 'Alternative Implementation', 'Methodical Structuring', 'Scale Execution'],
          correctAnswerIndex: 0,
          explanation: 'Standard foundational review confirms system design consistency.'
        });
      }
      return [...basicQuiz, ...extra];
    }
    return basicQuiz.slice(0, count);
  }

  const ai = getAI();
  const prompt = type === 'topic' 
    ? `Create a ${count}-question quiz on the topic: ${input}. Difficulty: ${difficulty}.`
    : `Create a ${count}-question quiz based on this text: "${input}". Difficulty: ${difficulty}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      systemInstruction: "You are an expert educator. Create high-quality multiple choice questions (MCQs). Each question must have 4 options, a correct answer index (0-3), and a brief explanation.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const chatWithEduBot = async (history: { role: string, parts: { text: string }[] }[]) => {
  const mode = getAIEngineMode();
  const key = process.env.GEMINI_API_KEY;
  const hasKey = typeof key === 'string' && key.trim().length > 0;

  if (shouldFallback()) {
    console.warn(`[EduBot] Using local fallback because mode=${mode} | keyDetected=${hasKey}`);
    return localChatWithEduBot(history);
  }

  try {
    const ai = getAI();
    const chatHistory = history.slice(0, -1);
    const lastMessageText = history[history.length - 1].parts[0].text;

    const chat = ai.chats.create({
      model: 'gemini-flash-latest',
      history: chatHistory,
      config: {
        systemInstruction: `You are EduBot, a helpful and professional academic and career utility advisor.
        
        GUIDELINES:
        1. Be concise and professional.
        2. Use Markdown for formatting (bolding, lists, headers).
        3. Do NOT use excessive line breaks. Use single line breaks for paragraphs and lists.
        4. Provide actionable advice for students and job seekers.
        5. Never start your reply with a heading like "ADVISOR RESPONSE" — go straight into the answer.`,
      }
    });

    const response = await chat.sendMessage({ message: lastMessageText });
    return response.text;
  } catch (err) {
    if (isGeminiServiceUnavailableError(err)) {
      console.warn('[EduBot] Gemini is currently overloaded; falling back to local response.', err);
      return localChatWithEduBot(history);
    }

    throw err;
  }
};

export const generateStudyPlan = async (goal: string, timeframe: string, dailyHours: number, currentLevel: string) => {
  if (shouldFallback()) {
    console.log("Dual-Engine Router: Routing generateStudyPlan to Local Engine");
    const result = localGenerateStudyPlan(goal);
    return {
      title: result.title,
      overview: result.overview,
      roadmapSummary: `A comprehensive student roadmap focused on learning ${goal} over a timeframe of ${timeframe}.`,
      phases: result.phases,
      tips: result.tips,
      resources: result.resources
    };
  }

  const ai = getAI();
  const prompt = `GOAL: ${goal}
  TIMEFRAME: ${timeframe}
  DAILY COMMITMENT: ${dailyHours} hours
  CURRENT LEVEL: ${currentLevel}`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      systemInstruction: "You are an expert study strategist. Create a concise, high-impact study roadmap. Focus on actionable milestones. Return JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overview: { type: Type.STRING },
          roadmapSummary: { type: Type.STRING, description: "A high-level 1-sentence roadmap summary" },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phaseName: { type: Type.STRING },
                duration: { type: Type.STRING },
                focus: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific resources (links or site names) for this phase" }
              },
              required: ["phaseName", "duration", "focus", "tasks", "resources"]
            }
          },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "overview", "roadmapSummary", "phases", "tips", "resources"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const translateText = async (text: string, targetLanguage: string) => {
  if (shouldFallback()) {
    console.log("Dual-Engine Router: Routing translateText to Local Engine");
    return `[Heuristic Fallback Translation: ${targetLanguage}]\n\n${text}`;
  }

  const ai = getAI();
  const prompt = `Translate the following text into ${targetLanguage}. 
  Maintain the original tone, formatting, and placeholders (like [Name]).
  Respond ONLY with the translated text.
  
  TEXT: ${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
  });

  return response.text;
};

export const generateDashboardInsights = async (activities: any[]) => {
  if (shouldFallback()) {
    console.log("Dual-Engine Router: Routing generateDashboardInsights to Local Engine");
    return localGenerateDashboardInsights(activities);
  }

  const ai = getAI();
  const summary = activities.map(a => `- ${a.type}: ${a.jobTitle || a.topic || a.goal || a.purpose}`).join('\n');
  
  const prompt = `Act as an expert academic and career growth advisor.
  Analyze the following recent user activities:
  ${summary}
  
  Provide a JSON response with:
  1. mainInsight: A punchy 1-sentence summary of their current focus or progress.
  2. recommendation: A specific, actionable next step for the user.
  3. skillGrowth: A number from 0-100 representing their perceived engagement level.`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mainInsight: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          skillGrowth: { type: Type.NUMBER }
        },
        required: ["mainInsight", "recommendation", "skillGrowth"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};