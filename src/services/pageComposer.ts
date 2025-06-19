import { Section, PagePlan } from '../types';

export function composePage(sections: Section[], pagePlan?: PagePlan): { html: string; css: string; js: string } {
  // Sort sections by their order in the plan
  const sortedSections = [...sections].sort((a, b) => {
    const aOrder = pagePlan?.sections.find(s => s.id === a.id)?.order ?? 999;
    const bOrder = pagePlan?.sections.find(s => s.id === b.id)?.order ?? 999;
    return aOrder - bOrder;
  });

  // Combine all HTML
  const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pagePlan?.title || 'Generated Landing Page'}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    ${sortedSections.map(section => section.html).join('\n    ')}
    <script src="script.js"></script>
</body>
</html>`;

  // Combine all CSS with global styles
  const combinedCss = `/* Global Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

/* Section Styles */
${pagePlan?.globalStyles || ''}

${sortedSections.map(section => section.css || '').join('\n\n')}`;

  // Combine all JavaScript
  const combinedJs = `// Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page loaded successfully!');
    
    // Global page functionality
    ${pagePlan?.globalScripts || ''}
    
    // Section-specific functionality
    ${sortedSections.map(section => section.js || '').join('\n\n    ')}
});`;

  return {
    html: combinedHtml,
    css: combinedCss,
    js: combinedJs
  };
}

export function updateSectionInPage(
  sections: Section[], 
  updatedSection: Section, 
  pagePlan?: PagePlan
): { html: string; css: string; js: string } {
  const updatedSections = sections.map(section => 
    section.id === updatedSection.id ? updatedSection : section
  );
  
  return composePage(updatedSections, pagePlan);
}