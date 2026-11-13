import { Suspense } from "react";
import SignupPageContent from "./SignupPageContent";
import "./signup.css";

export default function SignupPage() { return <Suspense fallback={<main className="signup-page" />}><SignupPageContent /></Suspense>; }
