import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Rightmo — Your product workspace", template: "%s | Rightmo" }, description: "A thoughtful workspace for your product collection." };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
