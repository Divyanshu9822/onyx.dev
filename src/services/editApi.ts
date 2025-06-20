import { GoogleGenerativeAI } from '@google/generative-ai';
import { PagePlan, Section } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const SECTION_IDENTIFICATION_PROMPT = `You are an expert at analyzing user requests for landing page edits. Your task is to identify which section of a landing page the user wants to modify.

Respond strictly with a JSON object in the following format:
{
  "sectionId": "section-id-here",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this section was chosen"
}

Guidelines:
- Analyze the user's request to determine which section they're referring to
- Consider keywords like "pricing", "hero", "testimonials", "contact", etc.
- If the request is ambiguous, choose the most likely section
- If no specific section can be determined, return the first section that could be modified
- Confidence should be between 0.0 and 1.0

Available sections will be provided in the context.

IMPORTANT:
- Return ONLY the JSON object, no explanations or markdown
- Always return a valid sectionId from the provided list`;

const SECTION_EDIT_PROMPT = `You are an expert front-end developer specializing in editing landing page sections. Your task is to modify an existing section based on user requirements while maintaining the overall design and functionality.

Respond strictly with a JSON object in the following format:
{
  "html": "Updated HTML for this section",
  "css": "Updated CSS styles for this section",
  "js": "Updated JavaScript for this section (if needed)"
}

Guidelines:

HTML:
- Modify the existing HTML structure to incorporate the requested changes
- Maintain semantic structure and accessibility
- Keep the same class prefixes and overall structure
- Only change what's necessary for the edit

CSS:
- Update styles to support the new HTML changes
- Maintain responsive design and visual consistency
- Keep the same class prefix system
- Only modify styles related to the changes

JavaScript:
- Update or add JavaScript only if the changes require interactivity
- Maintain existing functionality unless specifically asked to change it
- Use modern ES6+ syntax
- Return empty string if no JS changes are needed

Design Requirements:
- Maintain the overall visual style and branding
- Ensure changes integrate seamlessly with existing design
- Keep responsive behavior intact
- Preserve accessibility features

IMPORTANT:
- Return ONLY the JSON object, no explanations
- Make minimal changes - only what's requested
- Preserve the overall section structure and styling`;

export async function identifyTargetSection(
  userPrompt: string,
  pagePlan: PagePlan
): Promise<{ sectionId: string; confidence: number; reasoning: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file.');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: SECTION_IDENTIFICATION_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const contextPrompt = `
User Request: "${userPrompt}"

Available Sections:
${pagePlan.sections.map(section => 
  `- ID: ${section.id}, Name: ${section.name}, Type: ${section.type}, Description: ${section.description}`
).join('\n')}

Which section does the user want to modify?`;

    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    const parsedResponse = JSON.parse(responseText);

    if (!parsedResponse.sectionId) {
      throw new Error('Invalid section identification response');
    }

    return {
      sectionId: parsedResponse.sectionId,
      confidence: parsedResponse.confidence || 0.5,
      reasoning: parsedResponse.reasoning || 'Section identified based on user request'
    };
  } catch (error) {
    console.error('Error identifying target section:', error);
    throw new Error('Failed to identify target section. Please try again.');
  }
}

export async function editSection(
  userPrompt: string,
  section: Section,
  pagePlan: PagePlan
): Promise<{ html: string; css: string; js: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file.');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: SECTION_EDIT_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const contextPrompt = `
User Request: "${userPrompt}"

Page Context:
- Title: ${pagePlan.title}
- Description: ${pagePlan.description}

Section to Edit:
- Name: ${section.name}
- Type: ${section.type}
- Current HTML:
---
${section.html}
---

- Current CSS:
---
${section.css || ''}
---

- Current JavaScript:
---
${section.js || ''}
---

Please modify this section according to the user's request while maintaining the overall design and functionality.`;

    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    const parsedResponse = JSON.parse(responseText);

    if (!parsedResponse.html) {
      throw new Error('Invalid edit response format: missing HTML');
    }

    return {
      html: parsedResponse.html,
      css: parsedResponse.css || section.css || '',
      js: parsedResponse.js || section.js || ''
    };
  } catch (error) {
    console.error('Error editing section:', error);
    throw new Error(`Failed to edit ${section.name} section. Please try again.`);
  }
}