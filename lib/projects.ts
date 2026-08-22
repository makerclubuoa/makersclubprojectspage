import { supabase } from "./supabase";
import type { ProjectMedia } from "./media";

export type { ProjectMedia, MediaKind } from "./media";

export interface BuildLogEntry {
  date: string;
  title: string;
  body: string;
  milestone?: boolean;
  tag?: string;
  week_label?: string;
  image?: string;
}

export interface BOMItem {
  item: string;
  desc?: string;
  qty: number;
  unit_cost: number;
  src?: string;
}

export interface KudoEntry {
  who: string;
  role?: string;
  text: string;
}

export interface Project {
  id: string;
  title: string;
  blurb: string | null;
  description: string | null;
  category: string | null;
  date: string | null;
  likes: number | null;
  image: string | null;
  github: string | null;
  website: string | null;
  makers: string[] | null;
  tools: string[] | null;
  status: string | null;
  Featured: boolean | null;
  submitted_by: string | null;
  maker_ids: string[] | null;
  anon_count: number | null;
  // optional fields
  start_date: string | null;
  build_time: string | null;
  build_log: BuildLogEntry[] | null;
  gallery_images: string[] | null;
  media: ProjectMedia[] | null;
  bom: BOMItem[] | null;
  retro_wins: string[] | null;
  retro_fixes: string[] | null;
  kudos: KudoEntry[] | null;
}

export function resolvePublicName(profile: {
  display_name?: string | null;
  public_name?: string | null;
  name_preference?: string | null;
}): string {
  if (profile.name_preference === "public_name" && profile.public_name) {
    return profile.public_name;
  }
  return profile.display_name ?? "Anonymous";
}

export async function fetchMakerDisplay(
  project: Project,
): Promise<{ names: string[]; anonCount: number }> {
  if (!project.submitted_by) {
    return { names: project.makers ?? [], anonCount: project.anon_count ?? 0 };
  }

  const names: string[] = [];
  let anonCount = 0;
  let resolvedConsentedCoMakers = 0;

  const { data: submitter } = await supabase
    .from("profiles")
    .select("display_name, public_name, name_preference, credit_consented")
    .eq("id", project.submitted_by)
    .single();
  if (submitter) {
    if (submitter.credit_consented) names.push(resolvePublicName(submitter));
    else anonCount++;
  }

  if (project.maker_ids && project.maker_ids.length > 0) {
    // Exclude submitted_by — already handled above
    const coMakerIds = project.maker_ids.filter(
      (id) => id !== project.submitted_by,
    );
    if (coMakerIds.length > 0) {
      const { data: coMakers } = await supabase
        .from("profiles")
        .select("display_name, public_name, name_preference, credit_consented")
        .in("id", coMakerIds);
      for (const p of coMakers ?? []) {
        if (p.credit_consented) {
          names.push(resolvePublicName(p));
          resolvedConsentedCoMakers++;
        }
        else anonCount++;
      }
    }
  }

  // If the submitter profile doesn't exist yet, fall back entirely to stored names
  if (names.length === 0 && anonCount === 0) {
    return { names: project.makers ?? [], anonCount: project.anon_count ?? 0 };
  }

  const resolvedSet = new Set(names.map((n) => n.toLowerCase()));
  const extras = (project.makers ?? []).filter((n) => !resolvedSet.has(n.toLowerCase()));
  const legacySlots = Math.max(0, (project.makers ?? []).length - resolvedConsentedCoMakers);
  names.push(...extras.slice(0, legacySlots));

  return { names, anonCount };
}
type PublicProfile = {
  id: string;
  display_name: string | null;
  public_name: string | null;
  name_preference: string | null;
  credit_consented: boolean;
};

/** Resolves every card's makers with one profile query instead of two per project. */
export async function fetchMakerDisplays(
  projects: Project[],
): Promise<Record<string, { names: string[]; anonCount: number }>> {
  const ids = [...new Set(projects.flatMap((project) => [
    ...(project.submitted_by ? [project.submitted_by] : []),
    ...(project.maker_ids ?? []),
  ]))];
  const { data } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, public_name, name_preference, credit_consented")
        .in("id", ids)
    : { data: [] as PublicProfile[] };
  const profiles = new Map((data ?? []).map((profile: PublicProfile) => [profile.id, profile]));

  return Object.fromEntries(projects.map((project) => {
    if (!project.submitted_by) {
      return [project.id, { names: project.makers ?? [], anonCount: project.anon_count ?? 0 }];
    }
    const projectIds = [...new Set([project.submitted_by, ...(project.maker_ids ?? [])])];
    const found = projectIds.map((id) => profiles.get(id)).filter(Boolean) as PublicProfile[];
    if (found.length === 0) {
      return [project.id, { names: project.makers ?? [], anonCount: project.anon_count ?? 0 }];
    }
    const names = found.filter((profile) => profile.credit_consented).map(resolvePublicName);
    const anonCount = found.filter((profile) => !profile.credit_consented).length;
    const resolved = new Set(names.map((name) => name.toLowerCase()));
    const resolvedConsentedCoMakers = found.filter(
      (profile) => profile.id !== project.submitted_by && profile.credit_consented,
    ).length;
    const legacySlots = Math.max(0, (project.makers ?? []).length - resolvedConsentedCoMakers);
    names.push(...(project.makers ?? []).filter((name) => !resolved.has(name.toLowerCase())).slice(0, legacySlots));
    return [project.id, { names, anonCount }];
  }));
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "linear-gradient(146deg, #567dff 0%, #9f42d1 60%, #f04ab9 100%)",
  Textiles: "linear-gradient(146deg, #9f42d1 0%, #f04ab9 50%, #ff25c7 100%)",
  Food: "linear-gradient(146deg, #ff25c7 0%, #ff3c6d 50%, #ff856a 100%)",
  "3D Print": "linear-gradient(146deg, #567dff 0%, #9f42d1 100%)",
  Code: "linear-gradient(146deg, #9f42d1 0%, #ff25c7 100%)",
  Art: "linear-gradient(146deg, #f04ab9 0%, #ff856a 100%)",
  Wood: "linear-gradient(146deg, #ff3c6d 0%, #ff856a 100%)",
  Workshops: "linear-gradient(146deg, #567dff 0%, #ff25c7 100%)",
};

export function categoryColor(category: string | null): string {
  return (
    (category && CATEGORY_COLORS[category]) ||
    "linear-gradient(146deg, #567dff 0%, #f04ab9 100%)"
  );
}

// Solid pop text colour per category (aligned with each gradient's dominant
// hue) for Holtwood display headings. Unknown categories hash onto the palette
// so custom "Other" categories still get a stable colour.
const POP_TEXT_CLASSES = [
  "text-pop-blue",
  "text-pop-violet",
  "text-pop-magenta",
  "text-pop-pink",
  "text-pop-red",
  "text-pop-orange",
];
const CATEGORY_POP_TEXT: Record<string, string> = {
  Electronics: "text-pop-blue",
  "3D Print": "text-pop-violet",
  Code: "text-pop-magenta",
  Textiles: "text-pop-pink",
  Art: "text-pop-orange",
  Food: "text-pop-red",
  Wood: "text-pop-orange",
  Workshops: "text-pop-blue",
};
export function categoryPopText(category: string | null): string {
  if (category && CATEGORY_POP_TEXT[category])
    return CATEGORY_POP_TEXT[category];
  if (!category) return "text-pop-blue";
  let h = 0;
  for (let i = 0; i < category.length; i++)
    h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return POP_TEXT_CLASSES[h % POP_TEXT_CLASSES.length];
}

export const CATEGORIES = [
  "All",
  "Electronics",
  "3D Print",
  "Code",
  "Textiles",
  "Art",
  "Food",
  "Wood",
  "Workshops",
];

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("Projects")
    .select("*")
    .eq("status", "APPROVED")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("Projects")
    .select("*")
    .eq("id", id)
    .eq("status", "APPROVED")
    .single();
  if (error) return null;
  return data;
}
