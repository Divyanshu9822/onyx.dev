import { PagePlan, SectionPlan, SectionType } from '../types';
import { createModel } from '../api/llm/geminiClient';
import { runWithRetries } from '../utils/retryWithLimit';
import { PLANNING_PROMPT, getPlanningPrompt } from '../prompts/planPagePrompt';

/**
 * Generates a page plan with retry logic
 */
export async function generatePagePlan(prompt: string): Promise<PagePlan> {
  return runWithRetries(
    async () => {
      const model = createModel(PLANNING_PROMPT);
      
      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(getPlanningPrompt(prompt));
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
    },
    {
      onRetry: (error, attempt, maxAttempts) => {
        console.warn(`Error generating page plan (attempt ${attempt}/${maxAttempts}):`, error);
      },
      errorFilter: (error) => {
        // Don't retry API key errors
        return !error.message.includes('API key');
      }
    }
  );
}