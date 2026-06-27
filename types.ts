
export interface NavItem {
  label: string;
  href: string;
}

export enum ToolType {
  Handwritten = 'handwritten',
  ATS = 'ats',
  EmailGen = 'email-gen',
  QuizGen = 'quiz-gen',
  Interview = 'interview',
  Summarizer = 'summarizer'
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
}

export interface ResumeAnalysis {
  analysisId: string;
  userId: string;
  resumeFileURL: string;
  jobTitle: string;
  industry: string;
  atsScore: number;
  missingKeywords: string[];
  formattingTips: string[];
  strengthAreas: string[];
  aiFeedback: string;
  createdAt: any;
}

export interface InterviewFeedback {
  sessionId: string;
  userId: string;
  jobRole: string;
  performanceScore: number;
  strengths: string[];
  areasForImprovement: string[];
  rawTranscript?: string;
  createdAt: any;
}

export interface SummaryResult {
  summaryId: string;
  userId: string;
  originalLength: number;
  summaryText: string;
  keyInsights: string[];
  suggestedReading: string[];
  createdAt: any;
}

export interface GeminiAPIUsage {
  usageId: string;
  userId: string;
  toolType: ToolType;
  tokenCount: number;
  timestamp: any;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizSession {
  sessionId: string;
  userId: string;
  topic: string;
  score: number;
  questionCount: number;
  createdAt: any;
}
