import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

export async function extractWithObscura(url: string) {
  const endpoint = process.env.OBSCURA_ENDPOINT;

  if (!endpoint) {
    // Fallback to CLI mode
    try {
      const args = ["fetch", url, "--dump", "text", "--wait", "5"];
      const timeout = 60000;
      let stdout: string;

      try {
        const result = await execFileAsync("obscura", args, { timeout });
        stdout = result.stdout;
      } catch (err: unknown) {
        if (err instanceof Error && "code" in err && err.code === "ENOENT") {
          const homePath = path.join(os.homedir(), ".local", "bin", "obscura");
          const result = await execFileAsync(homePath, args, { timeout });
          stdout = result.stdout;
        } else {
          throw err;
        }
      }

      return {
        title: url,
        content: stdout,
        screenshotBase64: undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Obscura CLI extraction failed: ${msg}`);
    }
  }

  // We assume the Obscura endpoint accepts a POST request with the URL
  // and returns a JSON object with title, content, and optionally a screenshot
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, format: "markdown", includeScreenshot: true }),
  });

  if (!response.ok) {
    throw new Error(`Obscura extraction failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    title: data.title || url,
    content: data.content || data.markdown || "",
    screenshotBase64: data.screenshot || undefined,
  };
}
