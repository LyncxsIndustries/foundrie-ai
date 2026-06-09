"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type ADR = {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  date: string;
};

type RequirementsContent = {
  functional?: string[];
  nonFunctional?: string[];
  hidden?: string[];
  scale?: Record<string, string>;
  security?: string[];
  adrs?: ADR[];
};

type RequirementsData = {
  id: string;
  content: RequirementsContent;
  updatedAt: string;
};

type Props = {
  projectId: string;
  initialData: RequirementsData;
};

export function RequirementsReview({ projectId, initialData }: Props) {
  const [content, setContent] = useState<RequirementsContent>(
    initialData.content
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateSection = (
    key: keyof RequirementsContent,
    value: string[] | Record<string, string>
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/requirements/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {saveSuccess && (
        <div className="rounded-md bg-green-950/50 border border-green-800 p-3 text-sm text-green-200">
          Changes saved successfully
        </div>
      )}
      {saveError && (
        <div className="rounded-md bg-red-950/50 border border-red-800 p-3 text-sm text-red-200">
          {saveError}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Functional Requirements</CardTitle>
          <Badge variant="secondary">
            {content.functional?.length || 0} items
          </Badge>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-32"
            value={(content.functional || []).join("\n")}
            onChange={(e) =>
              updateSection(
                "functional",
                e.target.value.split("\n").filter(Boolean)
              )
            }
            placeholder="List functional requirements, one per line..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Non-Functional Requirements</CardTitle>
          <Badge variant="secondary">
            {content.nonFunctional?.length || 0} items
          </Badge>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-32"
            value={(content.nonFunctional || []).join("\n")}
            onChange={(e) =>
              updateSection(
                "nonFunctional",
                e.target.value.split("\n").filter(Boolean)
              )
            }
            placeholder="List non-functional requirements, one per line..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Hidden Requirements</CardTitle>
          <Badge variant="secondary">
            {content.hidden?.length || 0} items
          </Badge>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-32"
            value={(content.hidden || []).join("\n")}
            onChange={(e) =>
              updateSection(
                "hidden",
                e.target.value.split("\n").filter(Boolean)
              )
            }
            placeholder="List hidden/implicit requirements, one per line..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scale Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-24"
            value={
              content.scale
                ? Object.entries(content.scale)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n")
                : ""
            }
            onChange={(e) => {
              const lines = e.target.value.split("\n").filter(Boolean);
              const scaleObj = lines.reduce(
                (acc, line) => {
                  const [key, ...valParts] = line.split(":");
                  if (key && valParts.length > 0) {
                    acc[key.trim()] = valParts.join(":").trim();
                  }
                  return acc;
                },
                {} as Record<string, string>
              );
              updateSection("scale", scaleObj);
            }}
            placeholder="Key: Value format, one per line..."
          />
        </CardContent>
      </Card>

      {content.adrs && content.adrs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Architecture Decision Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.adrs.map((adr) => (
              <div key={adr.id}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{adr.title}</h4>
                  <Badge variant="outline">{adr.date}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Decision:</strong> {adr.decision}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Rationale:</strong> {adr.rationale}
                </p>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
