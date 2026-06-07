import { SignIn } from "@clerk/nextjs";

/**
 * Dedicated sign-in surface. The optional catch-all segment lets Clerk own its
 * internal routing (verification, factor-two, SSO callbacks) under `/sign-in`.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <SignIn />
    </main>
  );
}
