import { useState, useCallback } from 'react';
import { PageState, PagePlan, Section, SectionPlan } from '../types';
import { generatePagePlan } from '../services/planningApi';
import { generateSection } from '../services/sectionApi';
import { composePage } from '../services/pageComposer';
import { identifyTargetSection, editSection } from '../services/editApi';

// Configuration for parallel section generation
const MAX_PARALLEL_CALLS = 3;

export function usePageGeneration() {
  const [pageState, setPageState] = useState<PageState>({
    sections: [],
    isPlanning: false,
    isGenerating: false,
    isEditing: false,
    generationProgress: {
      current: 0,
      total: 0
    }
  });

  // Helper function to process sections in parallel with concurrency limit
  const generateSectionsInParallel = async (
    sectionPlans: SectionPlan[],
    plan: PagePlan,
    originalPrompt: string
  ) => {
    const results: { [key: string]: { html: string; css: string; js: string } } = {};
    const errors: { [key: string]: Error } = {};
    let completedCount = 0;

    // Function to process a single section
    const processSectionBatch = async (batch: SectionPlan[]) => {
      const batchPromises = batch.map(async (sectionPlan) => {
        try {
          // Mark section as generating
          setPageState(prev => ({
            ...prev,
            sections: prev.sections.map(section => 
              section.id === sectionPlan.id 
                ? { ...section, isGenerating: true }
                : section
            ),
            generationProgress: {
              ...prev.generationProgress,
              currentSection: sectionPlan.name
            }
          }));

          const sectionCode = await generateSection(sectionPlan, plan, originalPrompt);
          results[sectionPlan.id] = sectionCode;
          
          completedCount++;
          
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
            ),
            generationProgress: {
              current: completedCount,
              total: sectionPlans.length,
              currentSection: completedCount < sectionPlans.length ? 'Generating...' : undefined
            }
          }));
          
        } catch (error) {
          console.error(`Error generating section ${sectionPlan.name}:`, error);
          errors[sectionPlan.id] = error instanceof Error ? error : new Error('Unknown error');
          completedCount++;
          
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
            ),
            generationProgress: {
              current: completedCount,
              total: sectionPlans.length,
              currentSection: completedCount < sectionPlans.length ? 'Generating...' : undefined
            }
          }));
        }
      });

      await Promise.all(batchPromises);
    };

    // Process sections in batches to respect concurrency limit
    for (let i = 0; i < sectionPlans.length; i += MAX_PARALLEL_CALLS) {
      const batch = sectionPlans.slice(i, i + MAX_PARALLEL_CALLS);
      await processSectionBatch(batch);
    }

    return { results, errors };
  };

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

      // Step 3: Generate all sections in parallel with concurrency control
      await generateSectionsInParallel(plan.sections, plan, prompt);

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

  const editSectionByPrompt = useCallback(async (userPrompt: string) => {
    const { plan, sections } = pageState;
    if (!plan || sections.length === 0) {
      throw new Error('No page generated yet. Please generate a page first.');
    }

    try {
      setPageState(prev => ({ ...prev, isEditing: true }));

      // Step 1: Identify which section to edit
      const identification = await identifyTargetSection(userPrompt, plan);
      const targetSection = sections.find(s => s.id === identification.sectionId);
      
      if (!targetSection) {
        throw new Error('Could not identify the section to edit. Please be more specific.');
      }

      // Step 2: Mark section as generating
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === identification.sectionId 
            ? { ...section, isGenerating: true }
            : section
        )
      }));

      // Step 3: Generate edited section
      const editedCode = await editSection(userPrompt, targetSection, plan);
      
      // Step 4: Update section with edited code
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === identification.sectionId 
            ? { 
                ...section, 
                html: editedCode.html,
                css: editedCode.css,
                js: editedCode.js,
                isGenerating: false
              }
            : section
        ),
        isEditing: false
      }));

      return {
        sectionId: identification.sectionId,
        sectionName: targetSection.name,
        changeDescription: userPrompt
      };

    } catch (error) {
      console.error('Error editing section:', error);
      setPageState(prev => ({
        ...prev,
        isEditing: false,
        sections: prev.sections.map(section => 
          ({ ...section, isGenerating: false })
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

  const hasGeneratedPage = useCallback(() => {
    return pageState.sections.length > 0 && pageState.sections.some(s => s.isGenerated);
  }, [pageState.sections]);

  return {
    pageState,
    generatePage,
    regenerateSection,
    editSectionByPrompt,
    updateSection,
    getComposedPage,
    hasGeneratedPage
  };
}