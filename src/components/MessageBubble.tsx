import React from 'react';
import { User, Bot, Copy, FileText, Palette, Code, RefreshCw } from 'lucide-react';
import { Message } from '../types';
import { GenerationProgress } from './GenerationProgress';

interface MessageBubbleProps {
  message: Message;
  pageState?: any;
  onRegenerateSection?: (sectionId: string) => void;
}

export function MessageBubble({ message, pageState, onRegenerateSection }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopyFile = async (fileName: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(fileName);
    setTimeout(() => setCopied(null), 2000);
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-3 max-w-[85%]">
          <div className="bg-onyx-primary text-white p-3 rounded-2xl rounded-tr-md shadow-sm">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="w-7 h-7 bg-onyx-primary rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-full w-full">
        <div className="w-7 h-7 bg-onyx-text-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Show generation progress if currently generating */}
          {pageState && (pageState.isPlanning || pageState.isGenerating) ? (
            <GenerationProgress pageState={pageState} />
          ) : message.generatedFiles ? (
            <div className="bg-onyx-surface p-4 rounded-2xl rounded-tl-md shadow-sm border border-onyx-border">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-onyx-accent rounded-full"></div>
                  <span className="text-sm font-medium text-onyx-text-primary">Generated successfully</span>
                </div>
                
                <p className="text-sm text-onyx-text-secondary mb-3">{message.content}</p>
                
                {/* Page Plan Summary */}
                {message.pagePlan && (
                  <div className="bg-onyx-bg-primary border border-onyx-border rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-medium text-onyx-text-primary mb-2">Page Structure</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {message.pagePlan.sections.map((section, index) => (
                        <div key={section.id} className="flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 bg-onyx-accent/20 rounded text-onyx-accent text-center leading-4 font-medium">
                            {index + 1}
                          </span>
                          <span className="text-onyx-text-secondary">{section.name}</span>
                          {onRegenerateSection && (
                            <button
                              onClick={() => onRegenerateSection(section.id)}
                              className="ml-auto p-1 hover:bg-onyx-bg-secondary rounded text-onyx-text-disabled hover:text-onyx-text-secondary"
                              title="Regenerate section"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* File Preview Cards - Compact */}
                <div className="space-y-2">
                  {[
                    { name: 'index.html', content: message.generatedFiles.html, icon: FileText, color: 'text-onyx-warning' },
                    { name: 'style.css', content: message.generatedFiles.css, icon: Palette, color: 'text-onyx-link' },
                    { name: 'script.js', content: message.generatedFiles.js, icon: Code, color: 'text-onyx-secondary' }
                  ].map(file => (
                    <div key={file.name} className="bg-onyx-bg-primary border border-onyx-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-onyx-bg-secondary border-b border-onyx-border">
                        <div className="flex items-center gap-2">
                          <file.icon className={`w-3.5 h-3.5 ${file.color}`} />
                          <span className="text-xs font-medium text-onyx-text-primary">{file.name}</span>
                        </div>
                        <button
                          onClick={() => handleCopyFile(file.name, file.content)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-onyx-surface border border-onyx-border rounded hover:bg-onyx-bg-secondary transition-colors text-onyx-text-secondary"
                        >
                          <Copy className="w-3 h-3" />
                          {copied === file.name ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-3">
                        <pre className="text-xs text-onyx-text-secondary overflow-x-auto whitespace-pre-wrap max-h-20 leading-relaxed">
                          {file.content.substring(0, 200)}
                          {file.content.length > 200 && '...'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-onyx-accent/10 border border-onyx-accent/30 rounded-lg">
                  <p className="text-xs text-onyx-text-primary">
                    🎉 Your landing page is ready! Each section was generated individually for maximum customization. Switch to the preview or code view to see and edit your files.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-onyx-surface p-4 rounded-2xl rounded-tl-md shadow-sm border border-onyx-border">
              <p className="text-sm text-onyx-text-secondary">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}