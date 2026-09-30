import { redirect } from "next/navigation";
export default function ProjectDocuments({ params }: { params: { projectId: string } }) {
  redirect(`/documents?project=${encodeURIComponent(params.projectId)}`);
}
