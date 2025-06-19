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

export function FileEditor({ files, activeFile, onFileChange, onActiveFileChange }: FileEditorProps) {
  const currentFile = files.find(f => f.name === activeFile);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* File Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {files.map((file) => {
          const Icon = FILE_ICONS[file.name as keyof typeof FILE_ICONS];
          return (
            <button
              key={file.name}
              onClick={() => onActiveFileChange(file.name)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeFile === file.name
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
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