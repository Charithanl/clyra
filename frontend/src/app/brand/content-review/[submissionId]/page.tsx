import SubmissionReview from "@/components/brand/content-review/SubmissionReview";
export default async function SubmissionReviewPage({ params }: { params: Promise<{ submissionId: string }> }) { const { submissionId } = await params; return <SubmissionReview submissionId={submissionId} />; }
