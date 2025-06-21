import JSZip from 'jszip';

export interface ProjectFiles {
  html: string;
  css: string;
  js: string;
}

/**
 * Creates a ZIP file from project files (HTML, CSS, JS)
 * @param project Object containing html, css, and js content
 * @returns Promise<Blob> ZIP file blob ready for download or upload
 */
export async function buildZip(project: ProjectFiles): Promise<Blob> {
  const zip = new JSZip();
  
  // Process HTML file to ensure proper external file references
  let htmlContent = project.html;
  
  // Remove any existing external references to avoid duplicates
  htmlContent = htmlContent.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  htmlContent = htmlContent.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
  htmlContent = htmlContent.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');
  
  // Add proper references to external files if they have content
  if (project.css && project.css.trim()) {
    const cssLink = '<link rel="stylesheet" href="style.css">';
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `  ${cssLink}\n</head>`);
    } else if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>\n  ${cssLink}`);
    } else {
      htmlContent = htmlContent.replace('<html>', `<html>\n<head>\n  ${cssLink}\n</head>`);
    }
  }
  
  if (project.js && project.js.trim()) {
    const jsScript = '<script src="script.js"></script>';
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `  ${jsScript}\n</body>`);
    } else {
      htmlContent = htmlContent + `\n${jsScript}`;
    }
  }
  
  // Add files to ZIP
  zip.file('index.html', htmlContent);
  zip.file('style.css', project.css);
  zip.file('script.js', project.js);
  
  // Generate and return ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}