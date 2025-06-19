import { useState, useCallback } from 'react';
import { EditorState, EditorFile, GeneratedFiles } from '../types';

const DEFAULT_FILES: EditorFile[] = [
  {
    name: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Welcome to your generated website!</h1>
    <p>Submit a prompt to generate your custom web application.</p>
    <script src="script.js"></script>
</body>
</html>`,
    language: 'html'
  },
  {
    name: 'style.css',
    content: `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

p {
    font-size: 1.2rem;
    opacity: 0.9;
}`,
    language: 'css'
  },
  {
    name: 'script.js',
    content: `// Welcome to your JavaScript file!
console.log('Website loaded successfully!');

// Add your interactive functionality here
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is ready!');
});`,
    language: 'javascript'
  }
];

export function useEditor() {
  const [state, setState] = useState<EditorState>({
    files: DEFAULT_FILES,
    activeFile: 'index.html'
  });

  const updateFileContent = useCallback((fileName: string, content: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(file => 
        file.name === fileName ? { ...file, content } : file
      )
    }));
  }, []);

  const setActiveFile = useCallback((fileName: string) => {
    setState(prev => ({
      ...prev,
      activeFile: fileName
    }));
  }, []);

  const loadGeneratedFiles = useCallback((generatedFiles: GeneratedFiles) => {
    setState(prev => ({
      ...prev,
      files: [
        { name: 'index.html', content: generatedFiles.html, language: 'html' },
        { name: 'style.css', content: generatedFiles.css, language: 'css' },
        { name: 'script.js', content: generatedFiles.js, language: 'javascript' }
      ]
    }));
  }, []);

  const getFileContent = useCallback((fileName: string) => {
    const file = state.files.find(f => f.name === fileName);
    return file ? file.content : '';
  }, [state.files]);

  return {
    ...state,
    updateFileContent,
    setActiveFile,
    loadGeneratedFiles,
    getFileContent
  };
}