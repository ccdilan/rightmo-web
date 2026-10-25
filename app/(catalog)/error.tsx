"use client";
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) { return <div className="empty-state"><h1>A small interruption.</h1><p>We couldn’t load your collection. Please try again in a moment.</p><button className="button primary" onClick={retry}>Try again</button></div>; }
