import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "./legal-page.css";

type Policy = "privacy" | "terms";

const content = {
  privacy: {
    title: "Privacy notice",
    intro: "This draft explains the kinds of information the Clyra product may use while you explore its creator partnership workflows.",
    sections: [
      ["Information in the product", "The current demo screens may contain details you enter, such as your name, email address, creator profile, social account references, campaign activity, and preferences. Do not enter passwords or sensitive personal information into demo forms."],
      ["How information is used", "Product information is used to demonstrate profile setup, campaign discovery, collaboration, content review, and workspace settings. Some screens use sample data or browser storage; demo data is not a promise of production account storage."],
      ["Demo limitations", "Clyra is still under development. The demo does not provide a complete account system, authentication, or production data controls. Information saved in this browser may be removed when browser storage is cleared."],
      ["Questions and final policy", "This page is draft product information, not a finalized privacy policy. Contact details and final data handling terms will be added before public account registration is launched."],
    ],
  },
  terms: {
    title: "Terms of use",
    intro: "These draft terms describe expected use of the Clyra product preview. They are not a final agreement for a production service.",
    sections: [
      ["Product preview", "Clyra is being developed to support creator discovery, campaign management, collaboration, content review, and performance insights. Some screens and records are demonstrative and may not represent a live service."],
      ["Demo access", "The Explore experience and signup preview do not create an authenticated account. Do not rely on demo records as durable records or submit confidential information."],
      ["Your content and decisions", "If you use preview forms, enter only information you are comfortable using in a product demo. Content checks are advisory; the demo does not replace human review or agreements between brands and creators."],
      ["Draft status", "These terms are draft informational content for product review. Final terms, service scope, and contact information will be provided before real account registration is enabled."],
    ],
  },
} satisfies Record<Policy, { title: string; intro: string; sections: [string, string][] }>;

export default function LegalPage({ policy }: { policy: Policy }) {
  const page = content[policy];
  return <main className="legal-page">
    <header className="legal-nav"><Link href="/" className="legal-logo">clyra<span>CREATOR INTELLIGENCE</span></Link><nav aria-label="Main navigation"><Link href="/account-type">Get started</Link><Link href="/login">Log in</Link></nav></header>
    <article className="legal-content"><Link href="/" className="legal-back"><ArrowLeft size={14} /> Back to home</Link><p className="legal-draft-label">DRAFT INFORMATION · FOR PRODUCT REVIEW</p><h1>{page.title}</h1><p className="legal-intro">{page.intro}</p><div className="legal-sections">{page.sections.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}</div><p className="legal-draft-note">This page is draft informational content. It does not make legal compliance claims or replace finalized policies.</p><Link href="/account-type" className="legal-cta">Explore Clyra <ArrowRight size={15} /></Link></article>
    <footer className="legal-footer"><Link href="/">clyra</Link><span>Draft product information</span><nav aria-label="Legal pages"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
  </main>;
}
