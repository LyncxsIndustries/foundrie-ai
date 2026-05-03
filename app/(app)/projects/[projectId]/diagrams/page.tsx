import { Card } from "@/components/ui/card";

export default function DiagramsPage() {
  return (
    <div className="h-full w-full bg-[var(--color-bg-canvas)] relative">
      {/* Canvas placeholder styling */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(var(--color-border-strong) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          opacity: 0.3
        }}
      />
      
      {/* Floating Panel Placeholder */}
      <div className="absolute top-4 left-4 z-10 w-64">
        <Card className="bg-surface/90 backdrop-blur border-border p-4 shadow-lg">
          <h3 className="font-semibold text-sm">Diagram Categories</h3>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-diagram-yellow)]" />
              Structural
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-diagram-blue)]" />
              Behavioral
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
