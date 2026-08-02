import { ProjectDetailsPage } from '@/components/project/project-details';

export default async function ProjectDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailsPage projectId={id} />;
}
