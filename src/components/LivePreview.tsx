import React, { useRef, useEffect } from 'react';
import { EditorFile } from '../types';

interface LivePreviewProps {
  files: EditorFile[];
}

export function LivePreview({ files }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
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

          // Write the complete HTML to the iframe
          doc.open();
          doc.write(htmlContent);
          doc.close();
        }
      }
    }
  }, [files]);

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="ml-2 text-sm text-gray-600 font-medium">Live Preview</span>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}