import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { userFromRequest } from "@/lib/server-auth";
import { removeProjectAssets, validatedProjectWrite } from "@/lib/project-write";
import type { Project } from "@/lib/projects";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/;

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as { id?: unknown; project?: unknown; contact?: unknown };
    if (typeof body.id !== "string" || !ID_PATTERN.test(body.id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }
    const project = validatedProjectWrite(body.project);
    const requestedMakerIds = Array.isArray(project.maker_ids) ? project.maker_ids as string[] : [];
    const makerIds = [...new Set([user.id, ...requestedMakerIds])];
    const { data: memberProfiles, error: memberLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .in("id", makerIds);
    if (memberLookupError || memberProfiles?.length !== makerIds.length) {
      return NextResponse.json({ error: "Every maker must have a valid Maker Club account." }, { status: 400 });
    }
    const row = {
      ...project,
      id: body.id,
      status: "DRAFT",
      Featured: false,
      likes: 0,
      submitted_by: user.id,
      maker_ids: makerIds,
      date: new Date().toISOString().slice(0, 10),
    };

    const { error } = await supabaseAdmin.from("Projects").insert(row);
    if (error) {
      await removeProjectAssets(project as Project, body.id);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const contact = typeof body.contact === "string" ? body.contact.trim().slice(0, 240) : "";
    if (contact) {
      const { error: contactError } = await supabaseAdmin.from("project_contacts").insert({
        project_id: body.id,
        user_id: user.id,
        contact,
      });
      if (contactError) {
        await supabaseAdmin.from("Projects").delete().eq("id", body.id);
        await removeProjectAssets(project as Project, body.id);
        return NextResponse.json({ error: "Could not save project contact" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id: body.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
