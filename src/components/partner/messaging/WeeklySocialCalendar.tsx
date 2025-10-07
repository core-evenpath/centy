
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestIndustryTemplates } from '@/ai/flows/suggest-industry-templates';
import type { IndustryTemplate } from '@/lib/types';

interface WeeklySocialCalendarProps {
  onIdeaClick: (idea: string) => void;
  industry: string;
}

export default function WeeklySocialCalendar({ onIdeaClick, industry }: WeeklySocialCalendarProps) {
  const [ideas, setIdeas] = useState<IndustryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!industry) {
      setError("Industry information is not available.");
      setIsLoading(false);
      return;
    }

    const fetchIdeas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await suggestIndustryTemplates({ industry });
        if (result.templates && result.templates.length > 0) {
          setIdeas(result.templates);
        } else {
          throw new Error("AI did not return any suggestions.");
        }
      } catch (err: any) {
        console.error("Failed to generate AI suggestions:", err);
        setError("Could not generate AI suggestions at this time. Please try again later.");
        toast({
          variant: "destructive",
          title: "AI Generation Failed",
          description: "Failed to load marketing ideas from AI.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdeas();
  }, [industry, toast]);

  const handleIdeaClick = (idea: IndustryTemplate) => {
    onIdeaClick(idea.description);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            ✨ AI-Powered Marketing Ideas
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            For {industry}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Generating fresh ideas for you...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center p-8 text-center text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        )}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea, index) => (
              <button
                key={index}
                onClick={() => handleIdeaClick(idea)}
                className="group p-4 border rounded-lg text-left hover:bg-gray-50/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">{idea.icon || '💡'}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground mb-1 group-hover:text-primary">
                      {idea.name}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {idea.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
