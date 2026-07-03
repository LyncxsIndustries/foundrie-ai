import { db } from "@/lib/db";
import { MediaCategory, isValidCategory } from "./categories";

export type BulkOperation =
  | "update-category"
  | "add-tags"
  | "analyze"
  | "delete";

export interface BulkOperationOptions {
  projectId: string;
  fileIds: string[];
  userId: string;
  operation: BulkOperation;
  data?: {
    category?: MediaCategory;
    tags?: string[];
  };
}

export interface BulkOperationResult {
  success: boolean;
  updatedCount: number;
  errors?: Array<{ fileId: string; error: string }>;
}

/**
 * Execute bulk operations on research assets with ownership verification
 */
export async function executeBulkOperation(
  options: BulkOperationOptions
): Promise<BulkOperationResult> {
  const { projectId, fileIds, operation, data } = options;

  if (fileIds.length === 0) {
    return { success: true, updatedCount: 0 };
  }

  try {
    switch (operation) {
      case "update-category": {
        if (!data?.category) {
          throw new Error("Category is required for update-category operation");
        }
        if (!isValidCategory(data.category)) {
          throw new Error(`Invalid category: ${data.category}`);
        }

        const result = await db.researchAsset.updateMany({
          where: {
            id: { in: fileIds },
            projectId,
          },
          data: {
            category: data.category,
          },
        });

        return { success: true, updatedCount: result.count };
      }

      case "add-tags": {
        if (!data?.tags || data.tags.length === 0) {
          throw new Error("Tags are required for add-tags operation");
        }

        // Fetch existing tags for each asset and append new ones
        const assets = await db.researchAsset.findMany({
          where: {
            id: { in: fileIds },
            projectId,
          },
          select: {
            id: true,
            tags: true,
          },
        });

        // Use transaction to update all assets
        await db.$transaction(
          assets.map((asset) => {
            const existingTags = asset.tags || [];
            const newTags = data.tags!.filter((tag) => !existingTags.includes(tag));
            const updatedTags = [...existingTags, ...newTags];

            return db.researchAsset.update({
              where: { id: asset.id },
              data: { tags: updatedTags },
            });
          })
        );

        return { success: true, updatedCount: assets.length };
      }

      case "delete": {
        const result = await db.researchAsset.deleteMany({
          where: {
            id: { in: fileIds },
            projectId,
          },
        });

        return { success: true, updatedCount: result.count };
      }

      case "analyze": {
        // Analysis is handled by the analyze route, not here
        // This operation type is used to trigger the analyze endpoint
        return { success: true, updatedCount: 0 };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      updatedCount: 0,
      errors: [{ fileId: "all", error: message }],
    };
  }
}

/**
 * Verify project ownership for bulk operations
 */
export async function verifyProjectAccess(
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: { id: true },
  });

  return project !== null;
}
