"use client";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { FormError } from "./form-error";
import { Icon } from "./icons";
export function LoginForm({
  next,
  expired,
}: {
  next: string;
  expired: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setFields({});
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          next,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setFields(body.errors || {});
        throw new Error(body.message);
      }
      form.reset();
      setShowPassword(false);
      router.replace(body.redirect);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't sign in. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-form" aria-busy={pending}>
      {expired ? (
        <p className="notice">Your session has expired. Sign in to continue.</p>
      ) : null}
      <div className="field">
        <label htmlFor={`${id}-email`}>Email address</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          maxLength={255}
          required
          aria-invalid={!!fields.email}
          aria-describedby={fields.email ? `${id}-email-error` : undefined}
        />
        {fields.email ? (
          <p id={`${id}-email-error`} className="field-error">
            {fields.email[0]}
          </p>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor={`${id}-password`}>Password</label>
        <input
          id={`${id}-password`}
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          maxLength={1024}
          required
          aria-invalid={!!fields.password}
          aria-describedby={
            fields.password ? `${id}-password-error` : undefined
          }
        />
        <button
          className="password-toggle"
          type="button"
          aria-controls={`${id}-password`}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? "Hide password" : "Show password"}
        </button>
        {fields.password ? (
          <p id={`${id}-password-error`} className="field-error">
            {fields.password[0]}
          </p>
        ) : null}
      </div>
      <FormError
        message={error}
        fields={fields}
        targets={{ email: `${id}-email`, password: `${id}-password` }}
      />
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in to your workspace"}
        <Icon name="arrow" size={18} />
      </button>
      <p className="form-note">
        A considered collection. One simple workspace.
      </p>
    </form>
  );
}
