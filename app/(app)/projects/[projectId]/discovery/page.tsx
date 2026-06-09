import { DiscoveryChat } from "@/components/chat/DiscoveryChat";

interface DiscoveryPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const { projectId } = await params;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none p-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
        <p className="text-sm text-muted-foreground">
          Socratic interview to uncover requirements and stack preferences.
        </p>
      </div>
      <div className="flex-1 p-6 pt-0">
        <DiscoveryChat projectId={projectId} />
      </div>
    </div>
  );
}
