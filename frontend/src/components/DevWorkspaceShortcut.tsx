"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DevWorkspaceShortcut() {
  const pathname = usePathname();
  if (!pathname.startsWith("/signup") && !pathname.startsWith("/onboarding")) return null;
  return <Link className="dev-workspace-shortcut" href="/brand/overview">Jump to workspace <ArrowUpRight size={13} /></Link>;
}
