import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function fetchContext7Docs(libraryId: string, query: string) {
  try {
    const { stdout } = await execFileAsync(
      "npx",
      ["ctx7", "docs", libraryId, query],
      { timeout: 120_000 },
    );
    
    return {
      title: `Context7 Docs: ${libraryId}`,
      content: stdout,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Context7 extraction failed: ${message}`);
  }
}
