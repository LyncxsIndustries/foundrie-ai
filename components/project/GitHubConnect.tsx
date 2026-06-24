"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, RefreshCw, Layers } from "lucide-react";


interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

export function GitHubConnect({ projectId }: { projectId: string }) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInferring, setIsInferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const githubAppUrl = "https://github.com/apps/foundrie-ai"; // Placeholder link

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error("Failed to fetch repos");
        }
        setRepos([]);
        return;
      }
      const data = await res.json();
      setRepos(data.repos || []);
    } catch (err) {
      setError("Could not load authorized repositories.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInferArchitecture = async (owner: string, repo: string) => {
    setIsInferring(true);
    // In a real implementation this would call a new API route wrapping `inferArchitectureFromRepo`
    // For now we simulate the interaction.
    setTimeout(() => {
      setIsInferring(false);
      setSuccess(`Deriving architecture from ${owner}/${repo}...`);
    }, 1500);
  };

  return (
    <Card className="w-full max-w-2xl bg-surface border-surface/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect a repository to infer architecture or use it as a reference pattern.
        </CardDescription>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {repos.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-surface/50 space-y-4">
            <p className="text-sm text-muted">No repositories connected.</p>
            <Button asChild>
              <a href={githubAppUrl} target="_blank" rel="noopener noreferrer">
                <GitBranch className="w-4 h-4 mr-2" />
                Install GitHub App
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Authorized Repositories</h3>
              <Button variant="ghost" size="sm" onClick={fetchRepos} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div className="space-y-2">
              {repos.map((repo) => {
                const [owner, name] = repo.full_name.split("/");
                return (
                  <div key={repo.id} className="flex items-center justify-between p-3 border rounded-md bg-background/50">
                    <div>
                      <p className="text-sm font-medium">{repo.full_name}</p>
                      <p className="text-xs text-muted">{repo.private ? "Private" : "Public"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        disabled={isInferring}
                        onClick={() => handleInferArchitecture(owner, name)}
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        Infer Architecture
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
