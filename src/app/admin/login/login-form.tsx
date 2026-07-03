"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1 w-full rounded-xl border border-line px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-line px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-dark w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
