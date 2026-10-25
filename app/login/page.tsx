import { Suspense } from "react";
import { Brand, Icon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { safeReturnTo } from "@/lib/policies";
import type { SearchParams } from "@/lib/types";
export const metadata = { title: "Sign in" };
async function Form({ searchParams }: { searchParams: Promise<SearchParams> }) { const params = await searchParams; return <LoginForm next={safeReturnTo(params.next)} expired={params.expired === "1"} />; }
export default function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <div className="login-page"><section className="login-story"><Brand /><div className="login-story-content"><span className="eyebrow">A SPACE FOR GOOD THINGS</span><h1>Your collection.<br />A clearer picture.</h1><p>Discover, organize, and bring your products into focus. Everything you need, thoughtfully in one place.</p><div className="login-art" aria-hidden="true"><div className="art-orbit" /><div className="art-card card-back"><Icon name="box" size={64} /></div><div className="art-card card-front"><span className="art-card-image"><Icon name="image" size={62} /></span><span className="art-line" /><span className="art-line short" /><span className="art-badge"><Icon name="check" size={14} />All in one place</span></div><span className="art-spark">✳</span></div></div><span className="login-copyright">© 2026 Rightmo. Thoughtfully put together.</span></section><main className="login-main"><div className="login-mobile-brand"><Brand /></div><div className="login-form-container"><span className="eyebrow">YOUR WORKSPACE AWAITS</span><h2>Welcome back.</h2><p className="login-subtitle">Sign in to pick up where you left off.</p><Suspense fallback={<p>Loading sign-in form…</p>}><Form searchParams={searchParams} /></Suspense></div><p className="login-bottom">Simple tools. A little more possibility.</p></main></div>;
}
