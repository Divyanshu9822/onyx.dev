import { GoogleGenerativeAI } from '@google/generative-ai';
import { PagePlan, SectionPlan, SectionType } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const PLANNING_PROMPT = `You are an expert UX/UI designer and web architect. Your task is to analyze a user's request for a landing page and create a comprehensive structural plan.

Respond strictly with a JSON object in the following format:
{
  "title": "Landing page title",
  "description": "Brief description of the landing page purpose",
  "sections": [
    {
      "type": "header|hero|features|about|services|pricing|testimonials|cta|contact|footer",
      "name": "Human-readable section name",
      "description": "What this section should accomplish",
      "requirements": ["Specific requirement 1", "Specific requirement 2"]
    }
  ]
}

Available section types:
- header: Navigation, logo, menu
- hero: Main banner with headline and CTA
- features: Product/service features showcase
- about: About us/company information
- services: Services or products offered
- pricing: Pricing plans and packages
- testimonials: Customer reviews and social proof
- cta: Call-to-action section
- contact: Contact information and forms
- footer: Footer links and information

Guidelines:
- Analyze the user's request to determine what type of business/product this is for
- Choose 4-8 sections that make sense for their specific use case
- Order sections logically (header first, footer last)
- Be specific in requirements - mention colors, content types, functionality needed
- Consider the target audience and business goals
- Don't include sections that aren't relevant to their request

IMPORTANT:
- Return ONLY the JSON object, no explanations or markdown
- Ensure all section types are from the allowed list above
- Make requirements specific and actionable`;

// Maximum number of retries for failed API calls
const MAX_RETRIES = 3;

// Delay between retries (in milliseconds)
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Generates a page plan with retry logic
 */
export async function generatePagePlan(prompt: string): Promise<PagePlan> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file. Get your API key from https://makersuite.google.com/app/apikey');
  }

  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: PLANNING_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(`Create a structural plan for this landing page: ${prompt}`);
      const response = await result.response;
      const responseText = response.text();
      
      const parsedResponse = JSON.parse(responseText);

      if (!parsedResponse.title || !parsedResponse.sections || !Array.isArray(parsedResponse.sections)) {
        throw new Error('Invalid planning response format');
      }

      // Add IDs and order to sections
      const sectionsWithIds: SectionPlan[] = parsedResponse.sections.map((section: {
        type: string;
        name: string;
        description: string;
        requirements?: string[];
      }, index: number) => ({
        id: `section-${Date.now()}-${index}`,
        type: section.type as SectionType,
        name: section.name,
        description: section.description,
        order: index,
        requirements: section.requirements || []
      }));

      return {
        id: `plan-${Date.now()}`,
        title: parsedResponse.title,
        description: parsedResponse.description,
        sections: sectionsWithIds
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if we should retry
      if (retryCount < MAX_RETRIES) {
        console.warn(`Error generating page plan (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
        
        // Calculate delay with exponential backoff
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        // We've exhausted all retries
        console.error(`Failed to generate page plan after ${MAX_RETRIES + 1} attempts:`, error);
        
        if (lastError.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
        }
        
        // For the page plan, we need to throw an error as we can't proceed without it
        throw lastError;
      }
    }
  }
  
  // This should never be reached due to the throw in the catch block
  // but TypeScript needs it for type safety
  throw new Error('Failed to generate page plan. Please try again.');
}