"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface SessionCheckpoint {
  hasUnfinishedSession: boolean;
  resumeUrl: string | null;
  checkpointSummary: string | null;
  phase: string | null;
  lastActivityAt: string | null;
}

export function ResumeSessionPrompt({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [checkpoint, setCheckpoint] = React.useState<SessionCheckpoint | null>(null);
  const [isDiscarding, setIsDiscarding] = React.useState(false);

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/session`);
        if (!res.ok) return;
        const data: SessionCheckpoint = await res.json();
        if (data.hasUnfinishedSession) {
          setCheckpoint(data);
          setOpen(true);
        }
      } catch (err) {
        console.error("Session prompt error:", err);
      }
    };
    fetchSession();
  }, [projectId]);

  const handleResume = (e: React.MouseEvent) => {
    e.preventDefault();
    if (checkpoint?.resumeUrl) {
      router.push(checkpoint.resumeUrl);
    }
    setOpen(false);
  };

  const handleReviewHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
  };

  const handleDiscard = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDiscarding(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/session`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        console.error("Failed to discard session");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiscarding(false);
    }
  };

  if (!checkpoint) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unfinished Session Found</AlertDialogTitle>
          <AlertDialogDescription>
            {checkpoint.checkpointSummary}
            <br />
            Would you like to resume where you left off, review the history, or discard the unfinished state?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleReviewHistory}>Review history</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDiscard} disabled={isDiscarding}>
            {isDiscarding ? "Discarding..." : "Discard"}
          </Button>
          <AlertDialogAction onClick={handleResume}>
            Resume
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
