import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import DevWorkspaceShortcut from "@/components/DevWorkspaceShortcut";

export const metadata: Metadata = {
  title: "Clyra",
  description: "Creator campaign intelligence",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html lang="en">
      <body>{publishableKey ? <ClerkProvider publishableKey={publishableKey}>{children}<DevWorkspaceShortcut /></ClerkProvider> : <>{children}<DevWorkspaceShortcut /></>}</body>
    </html>
  );
}
