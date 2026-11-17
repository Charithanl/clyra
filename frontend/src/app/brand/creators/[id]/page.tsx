import { notFound } from "next/navigation";
import CreatorProfile from "@/components/brand/creators/CreatorProfile";
import { getBrandDirectoryCreators } from "@/lib/shared/services";

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const creator = getBrandDirectoryCreators().find((item) => item.id === id); if (!creator) notFound(); return <CreatorProfile creator={creator} />; }
