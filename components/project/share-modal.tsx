"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";

interface Member {
  id: string;
  user: { name: string | null; email: string };
  role: ProjectMemberRole;
  joinedAt: Date;
}

interface ShareModalProps {
  projectId: string;
  userRole: ProjectMemberRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareModal({
  projectId,
  userRole,
  open,
  onOpenChange,
}: ShareModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = userRole === ProjectMemberRole.OWNER;

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, projectId]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Failed to load members");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Collaborator invited successfully");
        setEmail("");
        await fetchMembers();
      } else {
        setError(data.message || "Failed to invite collaborator");
      }
    } catch {
      setError("Failed to invite collaborator");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this collaborator from the project?")) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        await fetchMembers();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to remove member");
      }
    } catch {
      setError("Failed to remove member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            {isOwner ? "Share Project" : "Project Members"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">
                  Invite by email
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-surface-elevated border-border text-text-primary"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !email.trim()}
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-500" role="status">
                  {success}
                </p>
              )}
            </form>
          )}

          <div className="space-y-2">
            <Label className="text-text-primary">
              {members.length} {members.length === 1 ? "Member" : "Members"}
            </Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-md bg-surface-elevated"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {member.user.name || member.user.email}
                    </p>
                    {member.user.name && (
                      <p className="text-xs text-text-tertiary truncate">
                        {member.user.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        member.role === ProjectMemberRole.OWNER
                          ? "default"
                          : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>
                    {isOwner &&
                      member.role === ProjectMemberRole.COLLABORATOR && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.id)}
                          className="text-text-tertiary hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
