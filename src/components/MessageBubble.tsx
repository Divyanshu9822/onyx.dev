import React from 'react';
import { User, Bot, Copy, FileText, Palette, Code } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-md shadow-sm">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-full w-full">
        <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-md shadow-sm">
            {message.generatedFiles ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">Generated successfully</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{message.content}</p>
                
                {/* File Preview Cards - Compact */}
                <div className="space-y-2">
                  {[
                    { name: 'index.html', content: message.generatedFiles.html, icon: FileText, color: 'text-orange-600' },
                    { name: 'style.css', content: message.generatedFiles.css, icon: Palette, color: 'text-blue-600' },
                    { name: 'script.js', content: message.generatedFiles.js, icon: Code, color: 'text-green-600' }
                  ].map(file => (
                    <div key={file.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <file.icon className={`w-3.5 h-3.5 ${file.color}`} />
                          <span className="text-xs font-medium text-gray-700">{file.name}</span>
                        </div>
                        <button
                          onClick={() => handleCopyFile(file.name, file.content)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          {copied === file.name ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-3">
                        <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-20 leading-relaxed">
                          {file.content.substring(0, 200)}
                          {file.content.length > 200 && '...'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    🎉 Your web application is ready! Switch to the preview or code view to see and edit your files.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{message.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}