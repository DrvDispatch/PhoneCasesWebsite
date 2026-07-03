import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Already signed in? Skip the form.
  if (await getSession()) redirect("/admin");

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl">
            Globe<span className="text-accent">Case</span> Admin
          </p>
          <p className="mt-1 text-sm text-ink-soft">Sign in to manage your store.</p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
