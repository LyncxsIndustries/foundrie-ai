import { ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-surface px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <a href="#" className="flex items-center gap-4 px-2.5 text-foreground">
                <div className="h-6 w-6 bg-primary rounded-sm" />
                Foundrie AI
              </a>
              <a href="/dashboard" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                Dashboard
              </a>
              <a href="#" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                Settings
              </a>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="hidden sm:flex flex-1 items-center gap-4 text-sm font-medium">
          <a href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="h-5 w-5 bg-primary rounded-sm" />
            <span>Foundrie AI</span>
          </a>
          <nav className="flex gap-4 ml-6 text-muted-foreground">
            <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
            <a href="#" className="hover:text-foreground transition-colors">Settings</a>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
