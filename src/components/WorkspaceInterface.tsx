import React, { useState, useEffect } from 'react';
import { FileEditor } from './FileEditor';
import { LivePreview } from './LivePreview';
import { useEditor } from '../hooks/useEditor';
import { GeneratedFiles } from '../types';
import { Eye, Code, Download, ExternalLink, Globe, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { deployToNetlify, DeployResult } from '../services/netlifyApi';

interface WorkspaceInterfaceProps {
  generatedFiles?: GeneratedFiles;
}

type ViewMode = 'preview' | 'code';

export function WorkspaceInterface({ generatedFiles }: WorkspaceInterfaceProps) {
  const { files, activeFile, updateFileContent, setActiveFile, loadGeneratedFiles } = useEditor();
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [showDeployResult, setShowDeployResult] = useState(false);

  useEffect(() => {
    if (generatedFiles) {
      loadGeneratedFiles(generatedFiles);
    }
  }, [generatedFiles, loadGeneratedFiles]);

  const handleDownloadFiles = () => {
    if (generatedFiles) {
      const filesToDownload = [
        { name: 'index.html', content: generatedFiles.html },
        { name: 'style.css', content: generatedFiles.css },
        { name: 'script.js', content: generatedFiles.js }
      ];

      filesToDownload.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  };

  const handlePopOutPreview = () => {
    if (!generatedFiles) return;

    const htmlFile = files.find(f => f.name === 'index.html');
    const cssFile = files.find(f => f.name === 'style.css');
    const jsFile = files.find(f => f.name === 'script.js');

    if (htmlFile) {
      // Start with the HTML content
      let htmlContent = htmlFile.content;
      
      // Remove any existing external CSS/JS references
      htmlContent = htmlContent.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
      htmlContent = htmlContent.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
      htmlContent = htmlContent.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');
      
      // Inject CSS directly into the head
      if (cssFile && cssFile.content.trim()) {
        const cssTag = `<style>${cssFile.content}</style>`;
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', `  ${cssTag}\n</head>`);
        } else if (htmlContent.includes('<head>')) {
          htmlContent = htmlContent.replace('<head>', `<head>\n  ${cssTag}`);
        } else {
          // If no head tag, add one
          htmlContent = htmlContent.replace('<html>', `<html>\n<head>\n  ${cssTag}\n</head>`);
        }
      }
      
      // Inject JavaScript directly before closing body tag
      if (jsFile && jsFile.content.trim()) {
        const jsTag = `<script>${jsFile.content}</script>`;
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `  ${jsTag}\n</body>`);
        } else {
          // If no body tag, add the script at the end
          htmlContent = htmlContent + `\n${jsTag}`;
        }
      }

      // Create a new window and write the HTML content
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.document.title = 'Generated Website Preview';
      }
    }
  };

  const handleDeployToNetlify = async () => {
    setIsDeploying(true);
    setDeployResult(null);
    setShowDeployResult(false);

    try {
      const result = await deployToNetlify(files);
      setDeployResult(result);
      setShowDeployResult(true);
    } catch (error) {
      setDeployResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      setShowDeployResult(true);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar - Fixed at top */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'code'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handlePopOutPreview}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            title="Open preview in new window"
          >
            <ExternalLink className="w-4 h-4" />
            Pop Out
          </button>
          <button
            onClick={handleDownloadFiles}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleDeployToNetlify}
            disabled={isDeploying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isDeploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {isDeploying ? 'Deploying...' : 'Deploy to Netlify'}
          </button>
        </div>
      </div>

      {/* Deploy Result Modal */}
      {showDeployResult && deployResult && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              {deployResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <h3 className="text-lg font-semibold">
                {deployResult.success ? 'Deployment Successful!' : 'Deployment Failed'}
              </h3>
            </div>
            
            {deployResult.success ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your site has been successfully deployed to Netlify!
                </p>
                
                {deployResult.deployUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Live URL:</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <a
                        href={deployResult.deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex-1 truncate"
                      >
                        {deployResult.deployUrl}
                      </a>
                      <button
                        onClick={() => copyToClipboard(deployResult.deployUrl!)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-red-600 text-sm">
                  {deployResult.error}
                </p>
                {deployResult.error?.includes('token') && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Need a Netlify token?</strong> Get one from{' '}
                      <a
                        href="https://app.netlify.com/user/applications#personal-access-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        your Netlify account
                      </a>{' '}
                      and add it to your .env file.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeployResult(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              {deployResult.success && deployResult.deployUrl && (
                <a
                  href={deployResult.deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Visit Site
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className="h-full p-6 overflow-auto">
            <LivePreview files={files} />
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            <FileEditor
              files={files}
              activeFile={activeFile}
              onFileChange={updateFileContent}
              onActiveFileChange={setActiveFile}
            />
          </div>
        )}
      </div>
    </div>
  );
}