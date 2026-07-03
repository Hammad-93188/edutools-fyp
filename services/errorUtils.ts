
import { AIErrorType } from '../components/AIErrorAlert';

export const classifyAIError = (err: any): { message: string, type: AIErrorType } => {
  const message = err?.message || String(err);
  
  if (message.includes('quota') || message.includes('429') || message.includes('limit')) {
    return {
      message: "AI generation limit reached for now. Please wait a few minutes and try again.",
      type: 'quota'
    };
  }

  if (message.includes('safety') || message.includes('blocked') || message.includes('finishReason: SAFETY')) {
    return {
      message: "The AI declined this request due to safety policies. Please rephrase your query.",
      type: 'safety'
    };
  }

  if (
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('try again later') ||
    message.includes('overloaded')
  ) {
    return {
      message: "The Gemini service is currently busy. I switched to a local fallback response for you. Please try again in a moment.",
      type: 'connection'
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('online')) {
    return {
      message: "Unable to connect to the AI engine. Please check your internet connection.",
      type: 'connection'
    };
  }

  if (message.includes('empty') || message.includes('short') || message.includes('required')) {
    return {
      message: message,
      type: 'input'
    };
  }

  return {
    message: "An unexpected error occurred while generating AI response. Please try again.",
    type: 'generic'
  };
};
