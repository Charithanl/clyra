import { notFound } from "next/navigation";
import CreatorProfile from "@/components/brand/creators/CreatorProfile";
import { creators } from "@/components/brand/creators/creatorData";

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const creator = creators.find((item) => item.id === id); if (!creator) notFound(); return <CreatorProfile creator={creator} />; }
