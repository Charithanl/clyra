import CreatorSubmissionDetail from "@/components/creator/CreatorSubmissionDetail";
export default async function SubmissionDetailPage({ params }: { params: Promise<{ submissionId: string }> }) { const { submissionId } = await params; return <CreatorSubmissionDetail submissionId={submissionId} />; }
