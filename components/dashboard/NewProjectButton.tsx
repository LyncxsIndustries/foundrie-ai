'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply magnetic hover effect
  useEffect(() => {
    if (buttonRef.current && !pending && !open) {
      return createMagneticEffect(buttonRef.current, {
        strength: 0.3,
        duration: 0.4,
      });
    }
  }, [pending, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10 second timeout
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName.trim() || 'Untitled Project' }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? 'Could not create the project.');
        setPending(false);
        return;
      }

      const { project } = (await res.json()) as { project: { id: string } };
      setOpen(false);
      setProjectName('');
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Could not create the project.');
      }
      setPending(false);
    }
  }

  // Handle dialog open state change
  const handleOpenChange = (newOpen: boolean) => {
    if (pending) return;
    setOpen(newOpen);
    if (!newOpen) {
      setProjectName('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          ref={buttonRef}
          size="lg"
          variant={variant}
          className="min-touch transition-shadow duration-300 hover:shadow-high"
          disabled={pending}
          aria-busy={pending}
          style={{
            willChange: 'transform',
          }}
        >
          <FolderPlus />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Give your new project a name. You can change this later in settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name" className="text-left">
                Name
              </Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome App"
                autoFocus
              />
            </div>
            {error ? (
              <p role="alert" className="text-xs text-state-error text-left">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
