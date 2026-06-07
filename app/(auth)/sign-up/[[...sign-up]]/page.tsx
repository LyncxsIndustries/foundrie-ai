import { SignUp } from "@clerk/nextjs";

/**
 * Dedicated sign-up surface. The optional catch-all segment lets Clerk own its
 * internal routing (verification, SSO callbacks) under `/sign-up`.
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <SignUp />
    </main>
  );
}
