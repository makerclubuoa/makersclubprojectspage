import { fetchMakerDisplays, fetchProjects } from "@/lib/projects";
import ProjectsPageContent from "../components/projects/ProjectsPageContent";

export const dynamic = "force-static";

export default async function ProjectsPage() {
  const projects = await fetchProjects();
  const makerDisplays = await fetchMakerDisplays(projects);
  return (
    <ProjectsPageContent
      initialProjects={projects}
      initialMakerDisplays={makerDisplays}
    />
  );
}
