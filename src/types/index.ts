export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedFiles?: GeneratedFiles;
  pagePlan?: PagePlan;
  editResult?: EditResult;
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
  currentLoadingMessageId: string | null;
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

// New types for agentic system
export interface PagePlan {
  id: string;
  title: string;
  description: string;
  sections: SectionPlan[];
  globalStyles?: string;
  globalScripts?: string;
}

export interface SectionPlan {
  id: string;
  type: SectionType;
  name: string;
  description: string;
  order: number;
  requirements: string[];
}

export type SectionType = 
  | 'header'
  | 'hero'
  | 'features'
  | 'about'
  | 'services'
  | 'pricing'
  | 'testimonials'
  | 'cta'
  | 'contact'
  | 'footer';

export interface Section {
  id: string;
  type: SectionType;
  name: string;
  html: string;
  css?: string;
  js?: string;
  isGenerated: boolean;
  isGenerating: boolean;
  isInEditPlan?: boolean;
}

export interface PageState {
  plan?: PagePlan;
  sections: Section[];
  isPlanning: boolean;
  isGenerating: boolean;
  isEditing: boolean;
  generationProgress: {
    current: number;
    total: number;
    currentSection?: string;
  };
}

// New types for edit functionality
export interface EditResult {
  sectionId: string;
  sectionName: string;
  changeDescription: string;
}

export interface EditRequest {
  userPrompt: string;
  targetSectionId: string;
  sectionName: string;
  originalContent: {
    html: string;
    css: string;
    js: string;
  };
}

// New types for project management
export interface Project {
  id: string;
  user_id: string;
  prompt: string;
  html: string;
  css: string;
  js: string;
  plan?: PagePlan;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  prompt: string;
  created_at: string;
}