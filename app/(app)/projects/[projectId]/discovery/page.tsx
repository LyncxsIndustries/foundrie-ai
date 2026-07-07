// Discovery phase page with viewport-locked layout (Feature 54).
// Phase header and chat input are fixed; only chat messages scroll.

import { DiscoveryChat } from '@/components/chat/DiscoveryChat';
import { GenerateRequirementsButton } from '@/components/chat/GenerateRequirementsButton';

interface DiscoveryPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Phase Header — fixed, never scrolls */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 bg-bg-surface/95 backdrop-blur-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
          <p className="text-sm text-muted mt-1">
            Socratic interview to uncover requirements and stack preferences.
          </p>
        </div>
        <GenerateRequirementsButton projectId={projectId} />
      </div>

      {/* Chat Area — fills remaining height, manages its own internal scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DiscoveryChat projectId={projectId} />
      </div>
    </div>
  );
}
