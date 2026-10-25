"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icons";
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message);
      }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't sign out. Try again.",
      );
      setPending(false);
    }
  }
  return (
    <div className="logout">
      <button
        className="icon-button"
        type="button"
        disabled={pending}
        onClick={logout}
        aria-label={pending ? "Signing out" : "Sign out"}
      >
        <Icon name="logout" />
      </button>
      {error ? (
        <p className="logout-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
