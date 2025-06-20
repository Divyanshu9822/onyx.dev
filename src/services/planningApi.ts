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

export async function generatePagePlan(prompt: string): Promise<PagePlan> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file. Get your API key from https://makersuite.google.com/app/apikey');
  }

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
    const sectionsWithIds: SectionPlan[] = parsedResponse.sections.map((section: any, index: number) => ({
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
    console.error('Error generating page plan:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
      }
      throw error;
    }
    throw new Error('Failed to generate page plan. Please try again.');
  }
}