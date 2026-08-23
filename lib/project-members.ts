import type { Project } from "@/lib/projects";

/**
 * The makers list is the source of truth for project management.  Older
 * records did not include their submitter in maker_ids, so retain that as a
 * read-only compatibility fallback until those records are edited.
 */
export function projectMemberIds(project: Pick<Project, "submitted_by" | "maker_ids">): string[] {
  const makerIds = [...new Set(project.maker_ids ?? [])].filter(Boolean);
  return makerIds.length ? makerIds : project.submitted_by ? [project.submitted_by] : [];
}

export function canManageProject(
  project: Pick<Project, "submitted_by" | "maker_ids">,
  userId: string,
): boolean {
  return projectMemberIds(project).includes(userId);
}
