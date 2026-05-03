import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-3xl text-center space-y-8">
        <div className="mx-auto w-16 h-16 bg-primary rounded-lg shadow-[0_0_40px_rgba(0,209,143,0.3)] mb-8" />
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          Foundrie <span className="text-primary">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          The pre-IDE architectural workspace for AI-assisted engineering. 
          Turn raw ideas into structured implementations.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <a href="/dashboard">
            <Button size="lg" className="h-12 px-8">Go to Workspace</Button>
          </a>
          <Button size="lg" variant="outline" className="h-12 px-8">View Examples</Button>
        </div>
      </div>
    </div>
  );
}
