import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

/**
 * Creates and returns a Gemini model instance with the specified configuration
 * @param systemInstruction The system instruction to use for the model
 * @param responseMimeType The MIME type of the expected response (default: 'application/json')
 * @returns A configured Gemini model instance
 */
export const createModel = (
  systemInstruction: string,
  responseMimeType: string = 'application/json'
) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file. Get your API key from https://makersuite.google.com/app/apikey');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
  
  return genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction,
    generationConfig: {
      responseMimeType,
    }
  });
};

/**
 * Singleton instance of the GoogleGenerativeAI client
 */
export const gemini = new GoogleGenerativeAI(GEMINI_API_KEY || '');