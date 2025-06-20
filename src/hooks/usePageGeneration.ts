import { useState, useCallback } from 'react';
import { PageState, PagePlan, Section, SectionPlan } from '../types';
import { generatePagePlan } from '../services/planningApi';
import { generateSection } from '../services/sectionApi';
import { composePage } from '../services/pageComposer';
import { planEdits, editSections } from '../services/editApi';

// Configuration for parallel section generation
const MAX_PARALLEL_CALLS = 4;

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
    const { plan } = pageState;
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
      setPageState(prev => ({
        ...prev,
        isEditing: true,
        generationProgress: {
          current: 0,
          total: 0,
          currentSection: 'Planning edits...'
        }
      }));

      // Step 1: Plan which sections to edit
      const editPlan = await planEdits(userPrompt, plan);
      
      if (editPlan.sections.length === 0) {
        throw new Error('Could not identify any sections to edit. Please be more specific.');
      }

      // Step 2: Mark sections that are part of the edit plan with a special flag
      // and reset their status
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => {
          const isInEditPlan = editPlan.sections.some(es => es.sectionId === section.id);
          return {
            ...section,
            isInEditPlan: isInEditPlan,
            // If in edit plan, reset generation status to prepare for editing
            isGenerating: false,
            // Keep isGenerated as is for sections not in the edit plan
            isGenerated: isInEditPlan ? false : section.isGenerated
          };
        }),
        generationProgress: {
          current: 0,
          total: editPlan.sections.length,
          currentSection: 'Planning complete'
        }
      }));

      // Step 3: Create a progress update function
      const updateProgress = (sectionId: string, status: 'editing' | 'updated' | 'failed') => {
        setPageState(prev => {
          // Count how many sections are already updated or failed
          const completedCount = prev.sections.filter(s =>
            s.isInEditPlan && (s.isGenerated || status === 'updated' && s.id === sectionId)
          ).length;
          
          return {
            ...prev,
            sections: prev.sections.map(section =>
              section.id === sectionId
                ? {
                    ...section,
                    isGenerating: status === 'editing',
                    isGenerated: status === 'updated'
                  }
                : section
            ),
            generationProgress: {
              current: completedCount,
              total: editPlan.sections.length,
              currentSection: status === 'editing' ?
                prev.sections.find(s => s.id === sectionId)?.name || 'Editing...' :
                undefined
            }
          };
        });
      };

      // Step 4: Edit all sections in parallel
      const editResults = await editSections(userPrompt, plan, sections, updateProgress);
      
      // Step 5: Update all sections with edited code
      setPageState(prev => ({
        ...prev,
        sections: prev.sections.map(section => {
          const editedSection = editResults.get(section.id);
          if (editedSection) {
            return {
              ...section,
              html: editedSection.html,
              css: editedSection.css,
              js: editedSection.js,
              isGenerating: false,
              isGenerated: true
            };
          }
          // Reset the isInEditPlan flag for all sections
          return {
            ...section,
            isInEditPlan: false
          };
        }),
        isEditing: false,
        generationProgress: {
          current: editPlan.sections.length,
          total: editPlan.sections.length
        }
      }));

      // Return information about the edited sections
      return {
        sectionId: editPlan.sections[0].sectionId, // For backward compatibility
        sectionName: sections.find(s => s.id === editPlan.sections[0].sectionId)?.name || '',
        changeDescription: editPlan.summary
      };

    } catch (error) {
      console.error('Error editing sections:', error);
      setPageState(prev => ({
        ...prev,
        isEditing: false,
        sections: prev.sections.map(section =>
          ({ ...section, isGenerating: false })
        ),
        generationProgress: {
          current: 0,
          total: 0
        }
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

  const getComposedPage = useCallback(async () => {
    return await composePage(pageState.sections, pageState.plan);
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