import { EditorFile } from '../types';
import { buildZip } from '../utils/buildZip';

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
    // Extract file contents
    const htmlFile = files.find(f => f.name === 'index.html');
    const cssFile = files.find(f => f.name === 'style.css');
    const jsFile = files.find(f => f.name === 'script.js');
    
    if (!htmlFile) {
      return {
        success: false,
        error: 'HTML file is required for deployment'
      };
    }
    
    // Create ZIP file using the utility function
    const zipBlob = await buildZip({
      html: htmlFile.content,
      css: cssFile?.content || '',
      js: jsFile?.content || ''
    });

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