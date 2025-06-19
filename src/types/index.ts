export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedFiles?: GeneratedFiles;
}

export interface GeneratedFiles {
  html: string;
  css: string;
  js: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface EditorFile {
  name: string;
  content: string;
  language: string;
}

export interface EditorState {
  files: EditorFile[];
  activeFile: string;
}