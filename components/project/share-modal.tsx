"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Share, UserMinus, UserPlus, Loader2 } from "lucide-react";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface Member {
  id: string; // userId for OWNER, projectMember.id for COLLABORATOR
  user: { name: string | null; email: string };
  role: ProjectMemberRole;
  joinedAt: Date;
}

interface ShareModalProps {
  projectId: string;
  role: ProjectMemberRole;
  members: Member[];
  children: React.ReactNode;
}

export function ShareModal({ projectId, role, members, children }: ShareModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to invite user");
      }
      setEmail("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove member");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{role === ProjectMemberRole.OWNER ? "Share Project" : "Project Members"}</DialogTitle>
        </DialogHeader>

        {error && <div className="text-sm text-destructive">{error}</div>}

        {role === ProjectMemberRole.OWNER && (
          <form onSubmit={handleInvite} className="flex flex-col gap-3 pb-4 border-b border-border">
            <Label htmlFor="email">Invite Collaborator</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviting}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={inviting || !email}>
                {inviting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4 mr-2" />}
                Invite
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-medium text-text-primary">Current Members</h4>
          <ScrollArea className="h-[240px] pr-4">
            {members.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-4">No members found.</div>
            ) : (
              <div className="space-y-4">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-bg-surface border border-border text-xs">
                          {m.user.name ? m.user.name.charAt(0).toUpperCase() : m.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {m.user.name || "Unknown"}
                        </span>
                        <span className="text-xs text-text-secondary truncate">{m.user.email}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {m.role}
                      </Badge>
                      {role === ProjectMemberRole.OWNER && m.role !== ProjectMemberRole.OWNER && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-text-muted hover:text-destructive"
                          onClick={() => handleRemove(m.id)}
                          disabled={removingId === m.id}
                          title="Remove collaborator"
                        >
                          {removingId === m.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserMinus className="size-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
