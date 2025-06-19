import React from 'react';
import Editor from '@monaco-editor/react';
import { EditorFile } from '../types';
import { FileText, Palette, Code } from 'lucide-react';

interface FileEditorProps {
  files: EditorFile[];
  activeFile: string;
  onFileChange: (fileName: string, content: string) => void;
  onActiveFileChange: (fileName: string) => void;
}

const FILE_ICONS = {
  'index.html': FileText,
  'style.css': Palette,
  'script.js': Code
};

const FILE_COLORS = {
  'index.html': 'text-onyx-warning',
  'style.css': 'text-onyx-link',
  'script.js': 'text-onyx-secondary'
};

export function FileEditor({ files, activeFile, onFileChange, onActiveFileChange }: FileEditorProps) {
  const currentFile = files.find(f => f.name === activeFile);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* File Tabs */}
      <div className="flex bg-onyx-text-primary border-b border-onyx-border">
        {files.map((file) => {
          const Icon = FILE_ICONS[file.name as keyof typeof FILE_ICONS];
          const colorClass = FILE_COLORS[file.name as keyof typeof FILE_COLORS];
          return (
            <button
              key={file.name}
              onClick={() => onActiveFileChange(file.name)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeFile === file.name
                  ? 'bg-gray-900 text-white border-b-2 border-onyx-accent'
                  : 'text-onyx-text-disabled hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeFile === file.name ? colorClass : ''}`} />
              {file.name}
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {currentFile && (
          <Editor
            height="100%"
            language={currentFile.language}
            value={currentFile.content}
            onChange={(value) => onFileChange(currentFile.name, value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
            }}
          />
        )}
      </div>
    </div>
  );
}