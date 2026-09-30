import { redirect } from "next/navigation";
export default function ProjectCosts({ params }: { params: { projectId: string } }) {
  redirect(`/expenses?project=${encodeURIComponent(params.projectId)}`);
}
