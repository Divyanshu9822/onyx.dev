import { PagePlan, Section } from '../types';
import { formatCode } from './formatterService';
import { createModel } from '../api/llm/geminiClient';
import { runWithRetries, MAX_PARALLEL_EDIT_REQUESTS } from '../utils/retryWithLimit';
import {
  EDIT_PLANNING_PROMPT,
  SECTION_EDIT_PROMPT,
  getEditPlanningPrompt,
  getEditSectionPrompt
} from '../prompts/editSectionPrompt';

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
  return runWithRetries(
    async () => {
      const model = createModel(EDIT_PLANNING_PROMPT);
      
      const contextPrompt = getEditPlanningPrompt(userPrompt, pagePlan);

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
    },
    {
      onRetry: (error, attempt, maxAttempts) => {
        console.warn(`Error planning edits (attempt ${attempt}/${maxAttempts}):`, error);
      }
    }
  );
}

/**
 * Edits a single section with retry logic
 */
export async function editSingleSection(
  userPrompt: string,
  section: Section,
  pagePlan: PagePlan
): Promise<{ html: string; css: string; js: string }> {
  return runWithRetries(
    async () => {
      const model = createModel(SECTION_EDIT_PROMPT);
      
      const contextPrompt = getEditSectionPrompt(userPrompt, section, pagePlan);

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
    },
    {
      onRetry: (error, attempt, maxAttempts) => {
        console.warn(`Error editing section ${section.name} (attempt ${attempt}/${maxAttempts}):`, error);
      },
      errorFilter: (error) => {
        // Don't retry API key errors
        return !error.message.includes('API key');
      },
      onFailure: (error, attempts) => {
        console.error(`Failed to edit section ${section.name} after ${attempts} attempts:`, error);
        
        // Return the original section content instead of throwing
        return {
          html: section.html,
          css: section.css || '',
          js: section.js || ''
        };
      }
    }
  );
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
  
  // Process sections in batches to limit concurrency
  const processSectionsInBatches = async (sections: Section[]) => {
    for (let i = 0; i < sections.length; i += MAX_PARALLEL_EDIT_REQUESTS) {
      const batch = sections.slice(i, i + MAX_PARALLEL_EDIT_REQUESTS);
      
      // Process this batch in parallel
      const batchPromises = batch.map(async (section) => {
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
      
      // Wait for the current batch to complete before moving to the next
      await Promise.all(batchPromises);
    }
  };
  
  // Process all sections in batches
  await processSectionsInBatches(sectionsToEdit);
  
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