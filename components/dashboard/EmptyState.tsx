'use client';

import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { fadeInStagger } from '@/lib/animations/dashboard';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll('.animate-item');
      fadeInStagger(Array.from(elements), {
        delay: 0.2,
        stagger: 0.15,
        duration: 0.5,
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center gap-3 px-6 py-16 text-center ${className || ''}`}
    >
      {icon && (
        <div className="text-text-muted animate-item">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold text-text-primary animate-item">
        {title}
      </h2>
      {message && (
        <p className="max-w-md text-sm text-text-secondary animate-item">
          {message}
        </p>
      )}
      {action && (
        <div className="mt-2 animate-item">
          {action}
        </div>
      )}
    </div>
  );
}
