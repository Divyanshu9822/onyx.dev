import { GoogleGenerativeAI } from '@google/generative-ai';
import { SectionPlan, PagePlan } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const SECTION_GENERATION_PROMPT = `You are an expert front-end web developer specializing in creating beautiful, modern landing page sections. Your task is to generate clean, production-ready HTML, CSS, and JavaScript for a specific section of a landing page.

Respond strictly with a JSON object in the following format:
{
  "html": "Complete HTML for this section only",
  "css": "CSS styles specific to this section (use section-specific class prefixes)",
  "js": "JavaScript code for this section's interactivity (if needed)"
}

Guidelines:

HTML:
- Create a complete, semantic HTML section
- Use a unique class prefix for this section (e.g., "hero-", "features-", "pricing-")
- Include proper semantic tags (section, article, header, etc.)
- Ensure accessibility with ARIA attributes where needed
- Don't include DOCTYPE, html, head, or body tags - just the section content

CSS:
- Write modern, responsive CSS using Flexbox/Grid
- Use the section-specific class prefix to avoid conflicts
- Include hover effects, transitions, and micro-interactions
- Ensure mobile-first responsive design
- Use modern color schemes and typography
- Make it visually appealing and professional

JavaScript:
- Use modern ES6+ syntax
- Only include JS if the section needs interactivity
- Use event delegation and proper DOM manipulation
- Ensure code is scoped to this section only
- Return empty string if no JS is needed

Design Requirements:
- Follow modern UI/UX best practices
- Create visually stunning, professional sections
- Use realistic content (no Lorem ipsum)
- Ensure consistent spacing and typography
- Make it look like a premium SaaS/business website

IMPORTANT:
- Return ONLY the JSON object, no explanations
- Ensure CSS classes are prefixed to avoid conflicts with other sections
- Make the section self-contained and reusable`;

// Maximum number of retries for failed API calls
const MAX_RETRIES = 3;

// Delay between retries (in milliseconds)
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Generates a section with retry logic
 */
export async function generateSection(
  sectionPlan: SectionPlan,
  pagePlan: PagePlan,
  originalPrompt: string
): Promise<{ html: string; css: string; js: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file. Get your API key from https://makersuite.google.com/app/apikey');
  }

  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: SECTION_GENERATION_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const contextPrompt = `
Original Request: ${originalPrompt}

Page Context:
- Title: ${pagePlan.title}
- Description: ${pagePlan.description}

Section to Generate:
- Type: ${sectionPlan.type}
- Name: ${sectionPlan.name}
- Description: ${sectionPlan.description}
- Requirements: ${sectionPlan.requirements.join(', ')}

Other Sections in Page: ${pagePlan.sections.map(s => s.name).join(', ')}

Generate a beautiful, professional ${sectionPlan.type} section that fits perfectly with the overall page theme and requirements.`;

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(contextPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      const parsedResponse = JSON.parse(responseText);

      if (!parsedResponse.html) {
        throw new Error('Invalid section response format: missing HTML');
      }

      return {
        html: parsedResponse.html,
        css: parsedResponse.css || '',
        js: parsedResponse.js || ''
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if we should retry
      if (retryCount < MAX_RETRIES) {
        console.warn(`Error generating section ${sectionPlan.name} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
        
        // Calculate delay with exponential backoff
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        // We've exhausted all retries
        console.error(`Failed to generate section ${sectionPlan.name} after ${MAX_RETRIES + 1} attempts:`, error);
        
        if (lastError.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
        }
        
        // Return a failed section instead of throwing
        return {
          html: `<section class="error-section ${sectionPlan.type}-section">
                  <div class="error-container">
                    <h2>Failed to generate ${sectionPlan.name}</h2>
                    <p>This section could not be generated after multiple attempts.</p>
                    <p class="error-details">Error: ${lastError.message}</p>
                  </div>
                </section>`,
          css: `.error-section {
                  padding: 2rem;
                  background-color: #fff5f5;
                  border: 1px solid #feb2b2;
                  border-radius: 0.5rem;
                  margin: 1rem 0;
                  text-align: center;
                }
                .error-container {
                  max-width: 800px;
                  margin: 0 auto;
                }
                .error-section h2 {
                  color: #e53e3e;
                  margin-bottom: 1rem;
                }
                .error-details {
                  font-family: monospace;
                  background-color: #f7fafc;
                  padding: 0.5rem;
                  border-radius: 0.25rem;
                  margin-top: 1rem;
                  font-size: 0.875rem;
                  color: #718096;
                }`,
          js: ''
        };
      }
    }
  }
  
  // This should never be reached due to the return in the catch block
  // but TypeScript needs it for type safety
  throw new Error(`Failed to generate ${sectionPlan.name} section. Please try again.`);
}