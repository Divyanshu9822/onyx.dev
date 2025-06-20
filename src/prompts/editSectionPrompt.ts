import { PagePlan, Section } from '../types';

/**
 * Prompt template for planning section edits
 */
export const EDIT_PLANNING_PROMPT = `You are an expert at analyzing user requests for landing page edits. Your task is to identify which sections of a landing page the user wants to modify.

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

/**
 * Prompt template for editing a section
 */
export const SECTION_EDIT_PROMPT = `You are an expert front-end developer specializing in editing landing page sections. Your task is to modify an existing section based on user requirements while maintaining the overall design and functionality.

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
 * Generates the context prompt for edit planning
 * @param userPrompt The user's edit request
 * @param pagePlan The overall page plan
 * @returns The complete context prompt for the edit planning model
 */
export const getEditPlanningPrompt = (
  userPrompt: string,
  pagePlan: PagePlan
): string => {
  return `
User Request: "${userPrompt}"

Available Sections:
${pagePlan.sections.map(section => 
  `- ID: ${section.id}, Name: ${section.name}, Type: ${section.type}, Description: ${section.description}`
).join('\n')}

Which sections does the user want to modify?`;
};

/**
 * Generates the context prompt for section editing
 * @param userPrompt The user's edit request
 * @param section The section to edit
 * @param pagePlan The overall page plan
 * @returns The complete context prompt for the section editing model
 */
export const getEditSectionPrompt = (
  userPrompt: string,
  section: Section,
  pagePlan: PagePlan
): string => {
  return `
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
};