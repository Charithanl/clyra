import Link from "next/link";
import { ArrowRight, FlaskConical, LineChart, Mail, Megaphone, Settings, Users } from "lucide-react";

const icons = { campaigns: Megaphone, creators: Users, invitations: Mail, review: Clipboard, analytics: LineChart, lab: FlaskConical, settings: Settings };
export default function BrandPlaceholder({ module, title, description }: { module: keyof typeof icons; title: string; description: string }) { const Icon = icons[module]; return <section className="brand-placeholder"><div className="placeholder-icon"><Icon size={23} /></div><div className="brand-overline">BRAND / AGENCY WORKSPACE</div><h1>{title}</h1><p>{description}</p><Link href="/brand/overview">Back to overview <ArrowRight size={14} /></Link></section>; }
function Clipboard({ size = 23 }: { size?: number }) { return <span style={{ fontSize: size }}>✓</span>; }
