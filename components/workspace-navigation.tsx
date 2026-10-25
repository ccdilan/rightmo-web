"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

export function WorkspaceLinks({
  categoriesActive,
}: {
  categoriesActive?: boolean;
}) {
  return (
    <nav aria-label="Main navigation" className="workspace-navigation">
      <Link
        href="/dashboard"
        className="nav-link"
        aria-current={categoriesActive === false ? "page" : undefined}
      >
        <Icon name="grid" />
        <span>Catalog</span>
      </Link>
      <Link
        href="/categories"
        className="nav-link"
        aria-current={categoriesActive ? "page" : undefined}
      >
        <Icon name="box" />
        <span>Categories</span>
      </Link>
    </nav>
  );
}
export function WorkspaceNavigation() {
  return (
    <WorkspaceLinks
      categoriesActive={usePathname().startsWith("/categories")}
    />
  );
}
