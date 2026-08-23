import { removeProjectAssets } from '@/lib/project-write'
import type { Project } from '@/lib/projects'
import { supabaseAdmin } from '@/lib/supabase-server'
import { projectMemberIds } from '@/lib/project-members'

type AccountDeletionResult = {
  deletedProjects: number
  transferredProjects: number
}

type ProfileName = {
  id: string
  display_name: string | null
  public_name: string | null
}

function withoutDepartingNames(
  makers: string[] | null,
  profile: ProfileName | null,
): string[] | null {
  if (!makers?.length || !profile) return makers
  const departingNames = new Set(
    [profile.display_name, profile.public_name]
      .filter((name): name is string => Boolean(name?.trim()))
      .map(name => name.trim().toLowerCase()),
  )
  const remaining = makers.filter(name => !departingNames.has(name.trim().toLowerCase()))
  return remaining.length ? remaining : null
}

async function deleteUserRows(table: string, column: string, userId: string) {
  const { error } = await supabaseAdmin.from(table).delete().eq(column, userId)
  if (error) throw new Error(`${table} cleanup failed: ${error.message}`)
}

/**
 * Removes a website account and its personal data.
 *
 * Shared projects are never deleted. If this member submitted one, ownership
 * moves to the first remaining, still-existing co-maker. Projects with no
 * remaining co-maker are deleted together with their stored media.
 *
 * Every operation is deliberately idempotent so a Ghost webhook and a
 * user-initiated deletion can safely overlap or be retried.
 */
export async function deleteSupabaseAccount(userId: string): Promise<AccountDeletionResult> {
  const [
    { data: profile, error: profileError },
    { data: memberRows, error: memberError },
    { data: contactRows, error: contactError },
  ] =
    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, display_name, public_name')
        .eq('id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('Projects')
        .select('*')
        .contains('maker_ids', [userId]),
      supabaseAdmin
        .from('Projects')
        .select('*')
        .eq('submitted_by', userId),
    ])

  if (profileError) throw new Error(`Profile lookup failed: ${profileError.message}`)
  if (memberError || contactError) {
    throw new Error(`Project lookup failed: ${memberError?.message ?? contactError?.message}`)
  }

  const relevantProjects = [...new Map(
    [...(memberRows ?? []), ...(contactRows ?? [])].map((project: Project) => [project.id, project]),
  ).values()]
  const possibleCoMakerIds = [...new Set(
    relevantProjects.flatMap(project => projectMemberIds(project)).filter(id => id !== userId),
  )]
  const validCoMakerIds = new Set<string>()

  if (possibleCoMakerIds.length) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('id', possibleCoMakerIds)
    if (error) throw new Error(`Co-maker lookup failed: ${error.message}`)
    for (const row of data ?? []) validCoMakerIds.add(row.id as string)
  }

  let transferredProjects = 0
  const soloProjects: Project[] = []

  // maker_ids is the equal-owner set. submitted_by is only its notification
  // contact, and is reassigned when that contact leaves a shared project.
  for (const project of relevantProjects) {
    const memberIds = projectMemberIds(project)
    const isMember = memberIds.includes(userId)
    const remainingIds = [...new Set(
      memberIds.filter(id => id !== userId && validCoMakerIds.has(id)),
    )]

    if (isMember && !remainingIds.length) {
      soloProjects.push(project)
      continue
    }

    // A departing contact who is no longer a maker must not delete a project.
    // Give an existing maker the contact role instead.
    if (!isMember && project.submitted_by !== userId) continue
    if (!remainingIds.length) {
      soloProjects.push(project)
      continue
    }

    const { error } = await supabaseAdmin
      .from('Projects')
      .update({
        ...(project.submitted_by === userId ? { submitted_by: remainingIds[0] } : {}),
        ...(isMember ? {
          maker_ids: remainingIds,
          makers: withoutDepartingNames(project.makers, profile as ProfileName | null),
        } : {}),
      })
      .eq('id', project.id)
    if (error) throw new Error(`Shared project transfer failed: ${error.message}`)
    transferredProjects++
  }

  // Only projects with no remaining account-backed maker are removed.
  for (const project of soloProjects) {
    const { error } = await supabaseAdmin
      .from('Projects')
      .delete()
      .eq('id', project.id)
    if (error) throw new Error(`Project deletion failed: ${error.message}`)
    await removeProjectAssets(project, project.id)
  }

  await deleteUserRows('project_contacts', 'user_id', userId)
  await deleteUserRows('comments', 'user_id', userId)
  await deleteUserRows('user_likes', 'user_id', userId)

  const { error: profileDeleteError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId)
  if (profileDeleteError) {
    throw new Error(`Profile deletion failed: ${profileDeleteError.message}`)
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError && !/not found|user_not_found/i.test(authError.message)) {
    throw new Error(`Login deletion failed: ${authError.message}`)
  }

  return { deletedProjects: soloProjects.length, transferredProjects }
}
