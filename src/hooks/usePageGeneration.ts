import { useState, useCallback } from 'react';
import { PageState, PagePlan, Section, SectionPlan } from '../types';
import { generatePagePlan } from '../services/planningApi';
import { generateSection } from '../services/sectionApi';
import { composePage } from '../services/pageComposer';

export function usePageGeneration() {
  const [pageState, setPageState] = useState<PageState>({
    sections: [],
    isPlanning: false,
    isGenerating: false,
    generationProgress: {
      current: 0,
      total: 0
    }
  });

  const generatePage = useCallback(async (prompt: string) => {
    try {
      // Step 1: Generate plan
      setPageState(prev => ({
        ...prev,
        isPlanning: true,
        sections: [],
        generationProgress: { current: 0, total: 0 }
      }));

      const plan = await generatePagePlan(prompt);
      
      // Step 2: Initialize sections
      const initialSections: Section[] = plan.sections.map(sectionPlan => ({
        id: sectionPlan.id,
        type: sectionPlan.type,
        name: sectionPlan.name,
        html: '',
        css: '',
        js: '',
        isGenerated: false,
        isGenerating: false
      }));

      setPageState(prev => ({
        ...prev,
        plan,
        sections: initialSections,
        isPlanning: false,
        isGenerating: true,
        generationProgress: {
          current: 0,
          total: plan.sections.length
        }
      }));

      // Step 3: Generate sections one by one
      for (let i = 0; i < plan.sections.length; i++) {
        const sectionPlan = plan.sections[i];
        
        // Mark current section as generating
        setPageState(prev => ({
          ...prev,
          sections: prev.sections.map(section => 
            section.id === sectionPlan.id 
              ? { ...section, isGenerating: true }
              : section
          ),
          generationProgress: {
            current: i,
            total: plan.sections.length,
            currentSection: sectionPlan.name
          }
        }));

        try {
          const sectionCode = await generateSection(sectionPlan, plan, prompt);
          
          // Update section with generated code
          setPageState(prev => ({
            ...prev,
            sections: prev.sections.map(section => 
              section.id === sectionPlan.id 
                ? { 
                    ...section, 
                    html: sectionCode.html,
                    css: sectionCode.css,
                    js: sectionCode.js,
                    isGenerated: true,
                    isGenerating: false
                  }
                : section
            )
          }));
        } catch (error) {
          console.error(`Error generating section ${sectionPlan.name}:`, error);
          
          // Mark section as failed but continue with others
          setPageState(prev => ({
            ...prev,
            sections: prev.sections.map(section => 
              section.id === sectionPlan.id 
                ? { 
                    ...section, 
                    html: `<section class="error-section"><h2>Failed to generate ${sectionPlan.name}</h2><p>Please try regenerating this section.</p></section>`,
                    isGenerated: false,
                    isGenerating: false
                  }
                : section
            )
          }));
        }
      }

      // Step 4: Complete generation
      setPageState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: {
          current: plan.sections.length,
          total: plan.sections.length
        }
      }));

    } catch (error) {
      console.error('Error in page generation:', error);
      setPageState(prev => ({
        ...prev,
        isPlanning: false,
        isGenerating: false,
        generationProgress: { current: 0, total: 0 }
      }));
      throw error;
    }
  }, []);

  const regenerateSection = useCallback(async (sectionId: string, originalPrompt: string) => {
    const { plan, sections } = pageState;
    if (!plan) return;

    const sectionPlan = plan.sections.find(s => s.id === sectionId);
    if (!sectionPlan) return;

    try {
      // Mark section as generating
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? { ...section, isGenerating: true }
            : section
        )
      }));

      const sectionCode = await generateSection(sectionPlan, plan, originalPrompt);
      
      // Update section with new code
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? { 
                ...section, 
                html: sectionCode.html,
                css: sectionCode.css,
                js: sectionCode.js,
                isGenerated: true,
                isGenerating: false
              }
            : section
        )
      }));
    } catch (error) {
      console.error(`Error regenerating section:`, error);
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? { ...section, isGenerating: false }
            : section
        )
      }));
      throw error;
    }
  }, [pageState]);

  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    setPageState(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates }
          : section
      )
    }));
  }, []);

  const getComposedPage = useCallback(() => {
    return composePage(pageState.sections, pageState.plan);
  }, [pageState.sections, pageState.plan]);

  return {
    pageState,
    generatePage,
    regenerateSection,
    updateSection,
    getComposedPage
  };
}