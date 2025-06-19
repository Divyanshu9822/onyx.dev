import JSZip from 'jszip';
import { EditorFile } from '../types';

const NETLIFY_TOKEN = import.meta.env.VITE_NETLIFY_TOKEN;

export interface NetlifyDeployResponse {
  id: string;
  deploy_id: string;
  url: string;
  deploy_url: string;
  admin_url: string;
  state: string;
  created_at: string;
}

export interface DeployResult {
  success: boolean;
  deployUrl?: string;
  claimUrl?: string;
  error?: string;
}

export async function deployToNetlify(files: EditorFile[]): Promise<DeployResult> {
  if (!NETLIFY_TOKEN) {
    return {
      success: false,
      error: 'Netlify token not found. Please add VITE_NETLIFY_TOKEN to your .env file. Get your token from https://app.netlify.com/user/applications#personal-access-tokens'
    };
  }

  try {
    // Create ZIP file
    const zip = new JSZip();
    
    // Process files and ensure proper structure
    files.forEach(file => {
      let content = file.content;
      
      // For HTML files, ensure they reference the CSS and JS files properly
      if (file.name === 'index.html') {
        // Remove any existing external references
        content = content.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
        content = content.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
        content = content.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');
        
        // Add proper references to external files
        const cssFile = files.find(f => f.name === 'style.css');
        const jsFile = files.find(f => f.name === 'script.js');
        
        if (cssFile && cssFile.content.trim()) {
          const cssLink = '<link rel="stylesheet" href="style.css">';
          if (content.includes('</head>')) {
            content = content.replace('</head>', `  ${cssLink}\n</head>`);
          } else if (content.includes('<head>')) {
            content = content.replace('<head>', `<head>\n  ${cssLink}`);
          } else {
            content = content.replace('<html>', `<html>\n<head>\n  ${cssLink}\n</head>`);
          }
        }
        
        if (jsFile && jsFile.content.trim()) {
          const jsScript = '<script src="script.js"></script>';
          if (content.includes('</body>')) {
            content = content.replace('</body>', `  ${jsScript}\n</body>`);
          } else {
            content = content + `\n${jsScript}`;
          }
        }
      }
      
      zip.file(file.name, content);
    });

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Deploy to Netlify - use proxy in development, direct API in production
    const isDevelopment = import.meta.env.DEV;
    const apiUrl = isDevelopment
      ? '/api/netlify/api/v1/sites'
      : 'https://api.netlify.com/api/v1/sites';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Deployment failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Use default error message if JSON parsing fails
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    const deployData: NetlifyDeployResponse = await response.json();

    return {
      success: true,
      deployUrl: deployData.url || deployData.deploy_url
    };

  } catch (error) {
    console.error('Error deploying to Netlify:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during deployment'
    };
  }
}