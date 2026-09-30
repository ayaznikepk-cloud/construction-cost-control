import { redirect } from "next/navigation";
export default function ProjectMaterials({ params }: { params: { projectId: string } }) {
  redirect(`/materials?project=${encodeURIComponent(params.projectId)}`);
}
