"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "./icons";
export function LoginForm({ next, expired }: { next: string; expired: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setFields({});
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password"), next }) });
      const body = await response.json();
      if (!response.ok) { setFields(body.errors || {}); throw new Error(body.message); }
      router.replace(body.redirect); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't sign in. Please try again."); setPending(false); }
  }
  return <form onSubmit={submit} className="login-form">
    {expired ? <p className="notice">Your session has expired. Sign in to continue.</p> : null}
    <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="username" placeholder="you@example.com" maxLength={255} required aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-error" : undefined} />{fields.email ? <p id="email-error" className="field-error">{fields.email[0]}</p> : null}</div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" maxLength={1024} required aria-invalid={!!fields.password} aria-describedby={fields.password ? "password-error" : undefined} />{fields.password ? <p id="password-error" className="field-error">{fields.password[0]}</p> : null}</div>
    {error ? <p className="error-message" role="alert">{error}</p> : null}
    <button className="button primary" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in to your workspace"}<Icon name="arrow" size={18} /></button>
    <p className="form-note">A considered collection. One simple workspace.</p>
  </form>;
}
