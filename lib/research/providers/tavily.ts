import { tavily } from "@tavily/core";

export async function extractWithTavily(url: string) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("Tavily API key not configured");
  }

  const tvly = tavily({ apiKey });
  const response = await tvly.extract([url]);

  if (response.failedResults && response.failedResults.length > 0) {
    throw new Error(`Tavily failed to extract URL: ${response.failedResults[0].url}`);
  }

  if (response.results && response.results.length > 0) {
    return {
      title: response.results[0].title || url,
      content: response.results[0].rawContent || "",
    };
  }

  throw new Error("No content returned from Tavily");
}
