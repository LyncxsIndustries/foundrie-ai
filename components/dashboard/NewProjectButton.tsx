'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createMagneticEffect } from '@/lib/animations/magnetic';

interface NewProjectButtonProps {
  variant?: 'default' | 'outline';
  label?: string;
}

export function NewProjectButton({
  variant = 'default',
  label = 'New project',
}: NewProjectButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply magnetic hover effect
  useEffect(() => {
    if (buttonRef.current && !pending) {
      return createMagneticEffect(buttonRef.current, {
        strength: 0.3,
        duration: 0.4,
      });
    }
  }, [pending]);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? 'Could not create the project.');
        setPending(false);
        return;
      }

      const { project } = (await res.json()) as { project: { id: string } };
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      setError('Could not create the project.');
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        ref={buttonRef}
        size="lg"
        variant={variant}
        className="min-touch transition-shadow duration-300 hover:shadow-high"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        style={{
          willChange: 'transform',
        }}
      >
        <FolderPlus />
        {pending ? 'Creating…' : label}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-state-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
