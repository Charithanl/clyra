import Link from "next/link";
import AccountTypeSelector from "@/components/auth/AccountTypeSelector";
import "./account-type.css";

export default function AccountTypePage() {
  return <main className="onboarding-page account-type-page"><nav className="account-nav"><Link className="onboarding-brand" href="/"><span>clyra</span><small>CREATOR INTELLIGENCE</small></Link><p>Already have an account? <Link href="/login">Log in</Link></p></nav><section className="account-type-intro"><div className="overline">GETTING STARTED</div><h1>How will you use <em>Clyra?</em></h1><p>Choose the experience that best describes you. We&apos;ll personalize your workspace around your goals.</p></section><AccountTypeSelector /></main>;
}
