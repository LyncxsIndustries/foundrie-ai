"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

type ProjectData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  lastZipUrl: string | null;
  lastZipFileName: string | null;
  lastZipGeneratedAt: Date | null;
  updatedAt: Date;
};

type Props = {
  project: ProjectData;
};

export function ProjectSettings({ project }: Props) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSuccess("Project updated successfully");
      router.refresh();
    } catch {
      setError("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      router.push("/dashboard");
    } catch {
      setError("Failed to delete project");
      setIsDeleting(false);
    }
  }

  async function handleRegenerate(section: string, endpoint: string) {
    setRegenerating(section);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate");

      setSuccess(`${section} regeneration started`);
    } catch {
      setError(`Failed to regenerate ${section.toLowerCase()}`);
    } finally {
      setRegenerating(null);
    }
  }

  async function handleClearZip() {
    setRegenerating("zip-clear");
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/clear-zip`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to clear ZIP metadata");

      setSuccess("ZIP metadata cleared");
      router.refresh();
    } catch {
      setError("Failed to clear ZIP metadata");
    } finally {
      setRegenerating(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-accent-primary/10 p-4 text-sm text-accent-primary">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Update your project name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regenerate Sections</CardTitle>
          <CardDescription>
            Regenerate project sections using updated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Requirements</p>
              <p className="text-sm text-muted-foreground">
                Regenerate from discovery chat
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleRegenerate(
                  "Requirements",
                  `/api/requirements/${project.id}/generate`
                )
              }
              disabled={regenerating !== null}
            >
              {regenerating === "Requirements" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "Requirements" ? (
                "Regenerating..."
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Diagrams</p>
              <p className="text-sm text-muted-foreground">
                Plan and generate diagrams
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleRegenerate("Diagrams", `/api/diagrams/${project.id}/plan`)
              }
              disabled={regenerating !== null}
            >
              {regenerating === "Diagrams" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "Diagrams" ? (
                "Regenerating..."
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Context Files</p>
              <p className="text-sm text-muted-foreground">
                Regenerate all context files
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleRegenerate(
                  "Context Files",
                  `/api/context-files/${project.id}/generate`
                )
              }
              disabled={regenerating !== null}
            >
              {regenerating === "Context Files" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "Context Files" ? (
                "Regenerating..."
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Feature Specs</p>
              <p className="text-sm text-muted-foreground">
                Regenerate feature specifications
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleRegenerate(
                  "Feature Specs",
                  `/api/feature-specs/${project.id}/generate`
                )
              }
              disabled={regenerating !== null}
            >
              {regenerating === "Feature Specs" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "Feature Specs" ? (
                "Regenerating..."
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Project Management Docs</p>
              <p className="text-sm text-muted-foreground">
                Regenerate SCOPE, TIMELINE, PRICING, and CHANGE_LOG
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleRegenerate(
                  "Project Management Docs",
                  `/api/project-management/${project.id}/generate`
                )
              }
              disabled={regenerating !== null}
            >
              {regenerating === "Project Management Docs" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "Project Management Docs" ? (
                "Regenerating..."
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Agent Skills</p>
              <p className="text-sm text-muted-foreground">
                Regenerate project-specific skills
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleRegenerate(
                  "Agent Skills",
                  `/api/skills/${project.id}/generate`
                )
              }
              disabled={regenerating !== null}
            >
              {regenerating === "Agent Skills" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "Agent Skills" ? (
                "Regenerating..."
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear ZIP Cache</p>
              <p className="text-sm text-muted-foreground">
                Remove cached ZIP metadata to force rebuild
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearZip}
              disabled={regenerating !== null || !project.lastZipUrl}
            >
              {regenerating === "zip-clear" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {regenerating === "zip-clear" ? (
                "Clearing..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Clear ZIP
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Project</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all its data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    project <strong>{project.name}</strong> and all associated data
                    including diagrams, requirements, and generated files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
