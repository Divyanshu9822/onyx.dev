import { GoogleGenerativeAI } from '@google/generative-ai';
import { PagePlan, Section } from '../types';
import { formatCode } from './formatterService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Maximum number of retries for failed API calls
const MAX_RETRIES = 3;

// Delay between retries (in milliseconds)
const RETRY_DELAY_BASE = 1000; // 1 second base delay

const EDIT_PLANNING_PROMPT = `You are an expert at analyzing user requests for landing page edits. Your task is to identify which sections of a landing page the user wants to modify.

Respond strictly with a JSON object in the following format:
{
  "sections": [
    {
      "sectionId": "section-id-here",
      "confidence": 0.95,
      "reasoning": "Brief explanation of why this section was chosen"
    }
  ],
  "summary": "Brief summary of the planned edits"
}

Guidelines:
- Analyze the user's request to determine which sections they're referring to
- Include ALL sections that need to be modified to fulfill the request
- Consider keywords like "pricing", "hero", "testimonials", "contact", etc.
- If the request is ambiguous, include all potentially relevant sections
- Confidence should be between 0.0 and 1.0
- The summary should briefly describe the planned changes

Available sections will be provided in the context.

IMPORTANT:
- Return ONLY the JSON object, no explanations or markdown
- Always return valid sectionIds from the provided list
- If multiple sections need to be edited, include all of them in the response`;

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

/**
 * Identifies all sections that need to be edited based on the user's request
 */
export async function planEdits(
  userPrompt: string,
  pagePlan: PagePlan
): Promise<{ 
  sections: Array<{ sectionId: string; confidence: number; reasoning: string }>;
  summary: string;
}> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file.');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: EDIT_PLANNING_PROMPT,
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

Which sections does the user want to modify?`;

    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    const parsedResponse = JSON.parse(responseText);

    if (!parsedResponse.sections || !Array.isArray(parsedResponse.sections) || parsedResponse.sections.length === 0) {
      throw new Error('Invalid edit planning response: missing or empty sections array');
    }

    return {
      sections: parsedResponse.sections.map((section: { sectionId: string; confidence?: number; reasoning?: string }) => ({
        sectionId: section.sectionId,
        confidence: section.confidence || 0.5,
        reasoning: section.reasoning || 'Section identified based on user request'
      })),
      summary: parsedResponse.summary || 'Multiple sections will be updated based on your request'
    };
  } catch (error) {
    console.error('Error planning edits:', error);
    throw new Error('Failed to plan edits. Please try again.');
  }
}

/**
 * Edits a single section with retry logic
 */
export async function editSingleSection(
  userPrompt: string,
  section: Section,
  pagePlan: PagePlan
): Promise<{ html: string; css: string; js: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file.');
  }

  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
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

      // Format the code using Prettier
      const formattedHtml = await formatCode(parsedResponse.html, 'html');
      const formattedCss = parsedResponse.css ? await formatCode(parsedResponse.css, 'css') : section.css || '';
      const formattedJs = parsedResponse.js ? await formatCode(parsedResponse.js, 'js') : section.js || '';

      return {
        html: formattedHtml,
        css: formattedCss,
        js: formattedJs
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if we should retry
      if (retryCount < MAX_RETRIES) {
        console.warn(`Error editing section ${section.name} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
        
        // Calculate delay with exponential backoff
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        // We've exhausted all retries
        console.error(`Failed to edit section ${section.name} after ${MAX_RETRIES + 1} attempts:`, error);
        
        if (lastError.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
        }
        
        // Return the original section content instead of throwing
        return {
          html: section.html,
          css: section.css || '',
          js: section.js || ''
        };
      }
    }
  }
  
  // This should never be reached due to the return in the catch block
  // but TypeScript needs it for type safety
  throw new Error(`Failed to edit ${section.name} section. Please try again.`);
}

/**
 * Edits multiple sections in parallel based on the edit plan
 */
export async function editSections(
  userPrompt: string,
  pagePlan: PagePlan,
  sections: Section[],
  updateProgress: (sectionId: string, status: 'editing' | 'updated' | 'failed') => void
): Promise<Map<string, { html: string; css: string; js: string }>> {
  // Create a map to store the results
  const results = new Map<string, { html: string; css: string; js: string }>();
  
  // Get the edit plan
  const editPlan = await planEdits(userPrompt, pagePlan);
  
  // Filter sections to edit based on the plan
  const sectionsToEdit = editPlan.sections.map(planSection => {
    const section = sections.find(s => s.id === planSection.sectionId);
    if (!section) {
      throw new Error(`Section with ID ${planSection.sectionId} not found`);
    }
    return section;
  });
  
  // Update progress for all sections that will be edited
  sectionsToEdit.forEach(section => {
    updateProgress(section.id, 'editing');
  });
  
  // Edit all sections in parallel
  const editPromises = sectionsToEdit.map(async (section) => {
    try {
      const result = await editSingleSection(userPrompt, section, pagePlan);
      results.set(section.id, result);
      updateProgress(section.id, 'updated');
      return { sectionId: section.id, success: true };
    } catch (error) {
      console.error(`Error editing section ${section.name}:`, error);
      updateProgress(section.id, 'failed');
      return { sectionId: section.id, success: false };
    }
  });
  
  // Wait for all edits to complete
  await Promise.all(editPromises);
  
  return results;
}

// Keep the original functions for backward compatibility
export async function identifyTargetSection(
  userPrompt: string,
  pagePlan: PagePlan
): Promise<{ sectionId: string; confidence: number; reasoning: string }> {
  const editPlan = await planEdits(userPrompt, pagePlan);
  // Return the first section from the plan for backward compatibility
  return editPlan.sections[0];
}

export async function editSection(
  userPrompt: string,
  section: Section,
  pagePlan: PagePlan
): Promise<{ html: string; css: string; js: string }> {
  return editSingleSection(userPrompt, section, pagePlan);
}