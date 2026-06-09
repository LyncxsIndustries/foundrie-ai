import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LiveblocksReactProvider } from "@/lib/liveblocks/provider";

/**
 * Maps Clerk's components onto the Foundrie dark workspace tokens so hosted
 * sign-in/sign-up surfaces match the rest of the product. Values reference the
 * design-system CSS variables defined in `globals.css` rather than raw hex.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorBackground: "var(--bg-surface)",
    colorForeground: "var(--text-primary)",
    colorInputBackground: "var(--bg-elevated)",
    colorInputForeground: "var(--text-primary)",
    colorNeutral: "var(--text-secondary)",
    colorBorder: "var(--border-default)",
    borderRadius: "var(--radius)",
  },
};

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foundrie AI",
  description:
    "A pre-IDE architectural workspace that turns a raw software idea into a complete, implementation-ready package.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <LiveblocksReactProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </LiveblocksReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
