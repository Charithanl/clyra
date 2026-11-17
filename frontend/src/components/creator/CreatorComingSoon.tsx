import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
export default function CreatorComingSoon({ title, description }: { title: string; description: string }) { return <div className="creator-content"><section className="creator-card creator-coming"><span><Sparkles size={22} /></span><div className="creator-overline">CREATOR WORKSPACE</div><h1>{title}</h1><p>{description}</p><Link href="/creator">Back to overview <ArrowRight size={13} /></Link></section></div>; }
