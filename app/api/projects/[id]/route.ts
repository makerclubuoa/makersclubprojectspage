import { NextRequest, NextResponse } from "next/server";
import { isAdmin, userFromRequest } from "@/lib/server-auth";
import { newlyAddedAssetUrls, removeProjectAssets, removedAssetUrls, removeStoredUrls, validatedProjectWrite } from "@/lib/project-write";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { Project } from "@/lib/projects";
import { canManageProject } from "@/lib/project-members";

async function projectAndUser(req: NextRequest, id: string) {
  const user = await userFromRequest(req);
  if (!user) return { user: null, project: null };
  const { data } = await supabaseAdmin.from("Projects").select("*").eq("id", id).single();
  return { user, project: data as Project | null };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, project } = await projectAndUser(req, id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = isAdmin(user);
  const canEdit = admin || canManageProject(project, user.id);
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json() as { project?: unknown };
    const update = validatedProjectWrite(body.project);
    const makerIds = Array.isArray(update.maker_ids) ? update.maker_ids as string[] : [];
    if (!makerIds.length) {
      return NextResponse.json({ error: "A project must have at least one maker." }, { status: 400 });
    }
    const { data: memberProfiles, error: memberLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .in("id", makerIds);
    if (memberLookupError || memberProfiles?.length !== makerIds.length) {
      return NextResponse.json({ error: "Every maker must have a valid Maker Club account." }, { status: 400 });
    }
    if (!admin) {
      Object.assign(update, { status: "DRAFT", Featured: false });
    }
    const after = { ...project, ...update } as Project;
    const { error } = await supabaseAdmin.from("Projects").update(update).eq("id", id);
    if (error) {
      await removeStoredUrls(newlyAddedAssetUrls(project, after), id);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await removeStoredUrls(removedAssetUrls(project, after), id);
    return NextResponse.json({ ok: true, reviewRequired: !admin });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, project } = await projectAndUser(req, id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin(user) && !canManageProject(project, user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error } = await supabaseAdmin.from("Projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await removeProjectAssets(project, id);
  return NextResponse.json({ ok: true });
}
