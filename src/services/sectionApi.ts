import { SectionPlan, PagePlan } from '../types';
import { createModel } from '../api/llm/geminiClient';
import { runWithRetries } from '../utils/retryWithLimit';
import { SECTION_GENERATION_PROMPT, getSectionGenerationPrompt } from '../prompts/generateSectionPrompt';

/**
 * Generates a section with retry logic
 */
export async function generateSection(
  sectionPlan: SectionPlan,
  pagePlan: PagePlan,
  originalPrompt: string
): Promise<{ html: string; css: string; js: string }> {
  return runWithRetries(
    async () => {
      const model = createModel(SECTION_GENERATION_PROMPT);
      
      const contextPrompt = getSectionGenerationPrompt(sectionPlan, pagePlan, originalPrompt);

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
    },
    {
      onRetry: (error, attempt, maxAttempts) => {
        console.warn(`Error generating section ${sectionPlan.name} (attempt ${attempt}/${maxAttempts}):`, error);
      },
      errorFilter: (error) => {
        // Don't retry API key errors
        return !error.message.includes('API key');
      },
      onFailure: (error, attempts) => {
        console.error(`Failed to generate section ${sectionPlan.name} after ${attempts} attempts:`, error);
        
        // Return a failed section instead of throwing
        return {
          html: `<section class="error-section ${sectionPlan.type}-section">
                  <div class="error-container">
                    <h2>Failed to generate ${sectionPlan.name}</h2>
                    <p>This section could not be generated after multiple attempts.</p>
                    <p class="error-details">Error: ${error.message}</p>
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
  );
}