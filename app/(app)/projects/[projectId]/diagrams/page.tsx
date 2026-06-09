import { LiveblocksRoomProvider } from "@/lib/liveblocks/room-provider";
import { DiagramCanvas } from "@/components/canvas/DiagramCanvas";

interface DiagramWorkspacePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function DiagramWorkspacePage({
  params,
}: DiagramWorkspacePageProps) {
  const { projectId } = await params;

  return (
    <div className="flex h-full w-full">
      <LiveblocksRoomProvider projectId={projectId}>
        <DiagramCanvas />
      </LiveblocksRoomProvider>
    </div>
  );
}
