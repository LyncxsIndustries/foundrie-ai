'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateRequirementsButtonProps {
  projectId: string;
}

export function GenerateRequirementsButton({ projectId }: GenerateRequirementsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch(`/api/requirements/${projectId}/generate`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Failed to trigger generation');
      }

      // Generation task is queued. Redirect to the requirements page.
      router.push(`/projects/${projectId}/requirements`);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert('Failed to generate requirements. Please try again.');
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          Generate Requirements
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}
