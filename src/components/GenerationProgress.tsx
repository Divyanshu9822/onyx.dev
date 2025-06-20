import React from 'react';
import { Loader2, CheckCircle, Clock, Edit3 } from 'lucide-react';
import { PageState } from '../types';

interface GenerationProgressProps {
  pageState: PageState;
}

export function GenerationProgress({ pageState }: GenerationProgressProps) {
  const { isPlanning, isGenerating, isEditing, generationProgress, sections } = pageState;

  if (!isPlanning && !isGenerating && !isEditing) {
    return null;
  }

  return (
    <div className="bg-onyx-surface p-4 rounded-2xl rounded-tl-md shadow-sm border border-onyx-border">
      {isPlanning ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-onyx-primary" />
          <div>
            <p className="text-sm font-medium text-onyx-text-primary">Planning your landing page...</p>
            <p className="text-xs text-onyx-text-secondary">Analyzing requirements and creating structure</p>
          </div>
        </div>
      ) : isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-onyx-primary animate-pulse" />
            <div>
              <p className="text-sm font-medium text-onyx-text-primary">
                {generationProgress.currentSection === 'Planning edits...'
                  ? 'Planning your edits...'
                  : `Applying changes (${generationProgress.current}/${generationProgress.total})`}
              </p>
              {generationProgress.currentSection && generationProgress.currentSection !== 'Planning edits...' && (
                <p className="text-xs text-onyx-text-secondary">
                  {generationProgress.currentSection === 'Planning complete'
                    ? 'Edit plan ready, applying changes...'
                    : `Currently updating: ${generationProgress.currentSection}`}
                </p>
              )}
            </div>
          </div>
          
          {/* Only show progress bar and section list if we're past planning */}
          {generationProgress.total > 0 && generationProgress.currentSection !== 'Planning edits...' && (
            <>
              {/* Progress bar */}
              <div className="w-full bg-onyx-bg-secondary rounded-full h-2">
                <div
                  className="bg-onyx-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(generationProgress.current / generationProgress.total) * 100}%`
                  }}
                />
              </div>

              {/* Section status list */}
              <div className="space-y-1">
                {sections.filter(section => section.isGenerating || section.isGenerated).map((section) => (
                  <div key={section.id} className="flex items-center gap-2 text-xs">
                    {section.isGenerated ? (
                      <CheckCircle className="w-3 h-3 text-onyx-accent" />
                    ) : section.isGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin text-onyx-primary" />
                    ) : (
                      <Clock className="w-3 h-3 text-onyx-text-disabled" />
                    )}
                    <span className={`${
                      section.isGenerated
                        ? 'text-onyx-text-primary'
                        : section.isGenerating
                          ? 'text-onyx-primary font-medium'
                          : 'text-onyx-text-disabled'
                    }`}>
                      {section.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-onyx-primary" />
            <div>
              <p className="text-sm font-medium text-onyx-text-primary">
                Generating sections ({generationProgress.current}/{generationProgress.total})
              </p>
              {generationProgress.currentSection && (
                <p className="text-xs text-onyx-text-secondary">
                  Currently working on: {generationProgress.currentSection}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-onyx-bg-secondary rounded-full h-2">
            <div 
              className="bg-onyx-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(generationProgress.current / generationProgress.total) * 100}%` 
              }}
            />
          </div>

          {/* Section status list */}
          <div className="space-y-1">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center gap-2 text-xs">
                {section.isGenerated ? (
                  <CheckCircle className="w-3 h-3 text-onyx-accent" />
                ) : section.isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-onyx-primary" />
                ) : (
                  <Clock className="w-3 h-3 text-onyx-text-disabled" />
                )}
                <span className={`${
                  section.isGenerated 
                    ? 'text-onyx-text-primary' 
                    : section.isGenerating 
                      ? 'text-onyx-primary font-medium'
                      : 'text-onyx-text-disabled'
                }`}>
                  {section.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}