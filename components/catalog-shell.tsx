import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { laravel, sessionToken } from "@/lib/api";
import type { User } from "@/lib/types";
import { WorkspaceLinks, WorkspaceNavigation } from "./workspace-navigation";
import { Brand } from "./icons";
import { LogoutButton } from "./logout-button";
async function Account() {
  const token = await sessionToken();
  let user: User | undefined;
  if (token) {
    try {
      user = (await laravel<{ data: User }>("/auth/me", {}, token)).data;
    } catch {
      /* The page presents authentication and service errors. */
    }
  }
  return (
    <div className="account">
      <span className="account-name">{user?.name || "Your workspace"}</span>
      <span className="avatar" aria-hidden="true">
        {user?.name
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("") || "R"}
      </span>
      <LogoutButton />
    </div>
  );
}
export function CatalogShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/dashboard" aria-label="Rightmo home">
          <Brand />
        </Link>
        <div className="workspace-pill">
          <span className="workspace-icon">R</span>
          <div>
            My workspace<small>Product collection</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <Suspense fallback={<WorkspaceLinks />}>
          <WorkspaceNavigation />
        </Suspense>
        <div className="sidebar-footer">
          <span className="small-leaf">✳</span>
          <p>
            Good things,
            <br />
            <strong>thoughtfully collected.</strong>
          </p>
          <span className="version">RIGHTMO WORKSPACE · 01</span>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span>/</span> <strong>Catalog management</strong>
          </span>
          <Suspense fallback={<span className="avatar">R</span>}>
            <Account />
          </Suspense>
        </header>
        <main id="main">{children}</main>
        <footer className="page-footer">
          <span>A place for every good find.</span>
          <span>Made with care. Rightmo.</span>
        </footer>
      </div>
    </div>
  );
}
