// Discovery phase page with fixed layout (Feature 54).
// Only chat messages scroll; header stays fixed at top.

import { DiscoveryChat } from '@/components/chat/DiscoveryChat';

interface DiscoveryPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 bg-surface">
        <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
        <p className="text-sm text-muted mt-1">
          Socratic interview to uncover requirements and stack preferences.
        </p>
      </div>

      {/* Chat Area - fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <DiscoveryChat projectId={projectId} />
      </div>
    </div>
  );
}
