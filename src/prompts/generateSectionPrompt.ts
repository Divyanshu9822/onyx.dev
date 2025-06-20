import { PagePlan, SectionPlan } from '../types';

/**
 * Prompt template for generating a landing page section
 */
export const SECTION_GENERATION_PROMPT = `You are an expert front-end web developer specializing in creating beautiful, modern landing page sections. Your task is to generate clean, production-ready HTML, CSS, and JavaScript for a specific section of a landing page.

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

/**
 * Generates the context prompt for section generation
 * @param sectionPlan The section plan to generate
 * @param pagePlan The overall page plan
 * @param originalPrompt The original user prompt
 * @returns The complete context prompt for the section generation model
 */
export const getSectionGenerationPrompt = (
  sectionPlan: SectionPlan,
  pagePlan: PagePlan,
  originalPrompt: string
): string => {
  return `
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
};