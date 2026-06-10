import { put, del } from "@vercel/blob";

export async function uploadDiagramPNG(
  buffer: Buffer,
  diagramId: string,
  version: number,
): Promise<{ url: string }> {
  const blob = await put(`diagrams/${diagramId}/v${version}.png`, buffer, {
    access: "public",
    contentType: "image/png",
  });
  return { url: blob.url };
}

export async function deleteDiagramPNG(url: string): Promise<void> {
  await del(url);
}
