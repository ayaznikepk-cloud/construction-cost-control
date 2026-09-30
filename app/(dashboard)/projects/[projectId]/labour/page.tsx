import { redirect } from "next/navigation";
export default function ProjectLabour({ params }: { params: { projectId: string } }) {
  redirect(`/attendance?project=${encodeURIComponent(params.projectId)}`);
}
