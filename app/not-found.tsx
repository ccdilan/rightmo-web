import Link from "next/link";
export default function NotFound() { return <div className="empty-state"><span className="eyebrow">404 · NOT IN THE COLLECTION</span><h1>This one has moved on.</h1><p>The product or page you’re looking for could not be found.</p><Link className="button primary" href="/dashboard">Back to collection</Link></div>; }
