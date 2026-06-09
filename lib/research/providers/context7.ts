import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function fetchContext7Docs(libraryId: string, query: string) {
  try {
    // Escape single quotes for the bash command
    const safeLibraryId = libraryId.replace(/'/g, "'\\''");
    const safeQuery = query.replace(/'/g, "'\\''");
    
    // We execute the ctx7 CLI
    const { stdout } = await execAsync(`npx ctx7 docs '${safeLibraryId}' '${safeQuery}'`);
    
    return {
      title: `Context7 Docs: ${libraryId}`,
      content: stdout,
    };
  } catch (error: any) {
    throw new Error(`Context7 extraction failed: ${error.message}`);
  }
}
