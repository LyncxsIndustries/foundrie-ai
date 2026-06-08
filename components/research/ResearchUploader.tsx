"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { ResearchAssetType } from "@/lib/generated/prisma/client";
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResearchUploaderProps {
  projectId: string;
}

export function ResearchUploader({ projectId }: ResearchUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [assetType, setAssetType] = useState<ResearchAssetType>("IMAGE_ASSET");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Reset state
    setError(null);
    setProgress(0);

    const file = files[0]; // Upload one by one for now for simplicity, or we could map over them.

    // 1. Client-side validation: Reject animations
    if (file.name.match(/\.(mp4|mov|webm|gif)$/i)) {
      setError("Raw animation files are not supported. Please upload a frame ZIP instead.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Client-side validation: Size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large. Maximum size is 50MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/research/${projectId}/upload`,
        clientPayload: JSON.stringify({ assetType }),
        onUploadProgress: (progressEvent) => {
          setProgress(progressEvent.percentage);
        },
      });

      // Refresh the page data
      router.refresh();
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      setError((err as Error).message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="bg-surface/50 border-border border-dashed">
      <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md w-full">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center gap-4 w-full justify-center">
          <div className="flex flex-col gap-2">
            <label htmlFor="asset-type" className="text-sm font-medium text-muted-foreground">
              Asset Type
            </label>
            <select
              id="asset-type"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as ResearchAssetType)}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isUploading}
            >
              <option value="IMAGE_ASSET">Image Asset</option>
              <option value="SCREENSHOT">Screenshot</option>
              <option value="INSPIRATION">Inspiration</option>
              <option value="DOCUMENT">Document</option>
              <option value="FRAME_ZIP">Frame ZIP</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown"
            />
            
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              variant="default"
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Select File
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Supports Images, Documents, and Frame ZIPs (Max 50MB).<br/>
              <span className="text-destructive/80">Animations (.mp4, .gif) are rejected.</span>
            </p>
          </div>
        </div>

        {isUploading && progress > 0 && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
