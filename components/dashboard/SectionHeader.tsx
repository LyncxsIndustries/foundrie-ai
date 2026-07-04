'use client';

import { useRef, useEffect } from 'react';
import { underlineExpand } from '@/lib/animations/dashboard';

interface SectionHeaderProps {
  title: string;
  count: number;
}

export function SectionHeader({ title, count }: SectionHeaderProps) {
  const underlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (underlineRef.current) {
      underlineExpand(underlineRef.current, true);
    }
  }, []);

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <span className="text-sm text-text-muted">({count})</span>
      </div>
      <div
        ref={underlineRef}
        className="h-0.5 w-16 bg-accent-primary mt-2"
        style={{
          transformOrigin: 'left center',
          transform: 'scaleX(0)',
        }}
      />
    </div>
  );
}
