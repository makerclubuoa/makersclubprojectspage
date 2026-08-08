"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Screentone from "@/app/components/global/Screentone";
import solderingIron from "@/public/doodle-soldering-iron.png";
import { resolvePublicName } from "@/lib/projects";
import { compressForUpload } from "@/lib/image-compress";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import CustomSelect from "@/app/components/CustomSelect";
import FormSection from "@/app/components/FormSection";
import MediaUploader, {
  uploadMediaDrafts,
  type DraftMedia,
} from "@/app/components/MediaUploader";
import {
  container,
  projectBack,
  secHead,
  secHeadRow,
  secHint,
  pageWrap,
  pageBand,
  pageBandTitle,
  pageBandSub,
  pageBandDoodle,
  submitMain,
  form,
  formInner,
  formFig,
  formActions,
  field,
  fieldLabel,
  fieldReq,
  fieldInput,
  fieldTextarea,
  fieldRow,
  btnGradient,
  btnArr,
  makersChips,
  makersChip,
  makersChipYou,
  makersChipTag,
  makersChipRemove,
  fieldTight,
  makersSearch,
  makersDropdown,
  makersDropdownItem,
  makersDropdownName,
  makersDropdownEmail,
  makersDropdownEmpty,
  imgUploadBase,
  imgUploadIdle,
  imgUploadPreview,
  imgUploadInner,
  imgUploadIcon,
  imgUploadHint,
  imgUploadRemove,
  toolTags,
  toolTag,
  toolTagOn,
  toolTagOther,
  toolTagOtherInput,
  toolTagOtherBtn,
  dynList,
  dynRow,
  dynRowRemove,
  dynRowCols3,
  dynRowCols4,
  dynRowMilestone,
  dynRowMilestoneInput,
  dynAdd,
  galleryUpload,
  galleryGrid,
  galleryThumb,
  galleryThumbImg,
  galleryThumbRemove,
  submitNotice,
  submitNoticeLine,
  submitNoticeIcon,
  submitNoticeConsent,
  submitNoticeConsentInput,
  submitNoticeConsentSpan,
  submitNoticeConsentSmall,
  submitGate,
  submitGateIcon,
  submitGateH2,
  submitGateP,
  submitSuccess,
  submitSuccessIcon,
  submitSuccessH2,
  submitSuccessP,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

const TOOL_SUGGESTIONS = [
  "Arduino",
  "Raspberry Pi",
  "3D printer",
  "Laser cutter",
  "Soldering iron",
  "Sewing machine",
  "Crochet hook",
  "Vinyl cutter",
  "KiCad",
  "Fusion 360",
  "Inkscape",
  "Figma",
  "p5.js",
  "Python",
  "Swift",
  "React",
  "Oven",
];

type LogEntry = {
  date: string;
  title: string;
  body: string;
  milestone: boolean;
  tag: string;
  image: string;
};
type BomRow = {
  item: string;
  desc: string;
  qty: string;
  unit_cost: string;
  src: string;
};

const emptyLog = (): LogEntry => ({
  date: "",
  title: "",
  body: "",
  milestone: false,
  tag: "",
  image: "",
});
const emptyBom = (): BomRow => ({
  item: "",
  desc: "",
  qty: "1",
  unit_cost: "",
  src: "",
});

export default function SubmitPage() {
  const { user, profile, loading } = useAuth();

  // Required
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");

  // Basic optional
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [buildTime, setBuildTime] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [contact, setContact] = useState("");

  // Makers
  type CoMakerProfile = {
    id: string;
    display_name: string;
    email: string | null;
    public_name: string | null;
    name_preference: string | null;
    credit_consented: boolean;
  };
  const [coMakers, setCoMakers] = useState<CoMakerProfile[]>([]);
  const [coMakerSearch, setCoMakerSearch] = useState("");
  const [coMakerResults, setCoMakerResults] = useState<CoMakerProfile[]>([]);
  const [showCoMakerDropdown, setShowCoMakerDropdown] = useState(false);

  // Tools
  const [tools, setTools] = useState<string[]>([]);
  const [otherTool, setOtherTool] = useState("");

  // Cover image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Gallery images
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Music & video
  const [mediaDrafts, setMediaDrafts] = useState<DraftMedia[]>([]);

  // Build log
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logEntryFiles, setLogEntryFiles] = useState<(File | null)[]>([]);
  const [logEntryPreviews, setLogEntryPreviews] = useState<(string | null)[]>(
    [],
  );

  // BOM
  const [bomRows, setBomRows] = useState<BomRow[]>([]);

  // Retro
  const [retroWins, setRetroWins] = useState("");
  const [retroFixes, setRetroFixes] = useState("");

  // Name visibility (mirrors credit_consented)
  const [hideName, setHideName] = useState(false);

  // Submit state
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Stats
  const [statsTotal, setStatsTotal] = useState<number | null>(null);
  const [statsThisYear, setStatsThisYear] = useState<number | null>(null);
  const [memberTotal, setMemberTotal] = useState<number | null>(null);

  useEffect(() => {
    const year = new Date().getFullYear();
    supabase
      .from("Projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "APPROVED")
      .then(({ count }) => setStatsTotal(count));
    supabase
      .from("Projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "APPROVED")
      .gte("date", `${year}-01-01`)
      .then(({ count }) => setStatsThisYear(count));
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setMemberTotal(count));
    supabase
      .from("Projects")
      .select("category")
      .eq("status", "APPROVED")
      .then(({ data }) => {
        const cats = [
          ...new Set((data ?? []).map((r) => r.category).filter(Boolean)),
        ].sort() as string[];
        setCategories(cats);
        setCategory((prev) => prev || cats[0] || "");
      });
  }, []);

  useEffect(() => {
    if (profile?.email && !contact) setContact(profile.email);
    if (profile) setHideName(!(profile.credit_consented ?? true));
  }, [profile]);

  useEffect(() => {
    if (!coMakerSearch.trim()) {
      setCoMakerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, display_name, email, public_name, name_preference, credit_consented",
        )
        .or(
          `display_name.ilike.%${coMakerSearch}%,public_name.ilike.%${coMakerSearch}%`,
        )
        .neq("id", user?.id ?? "")
        .limit(6);
      setCoMakerResults(
        (data ?? []).filter(
          (r: { id: string }) => !coMakers.some((m) => m.id === r.id),
        ),
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [coMakerSearch, coMakers, user]);

  // ── Makers ──────────────────────────────────────────
  function addCoMaker(r: {
    id: string;
    display_name: string;
    email: string | null;
    public_name: string | null;
    name_preference: string | null;
    credit_consented: boolean;
  }) {
    setCoMakers((prev) => [...prev, r]);
    setCoMakerSearch("");
    setCoMakerResults([]);
    setShowCoMakerDropdown(false);
  }
  function removeCoMaker(id: string) {
    setCoMakers((prev) => prev.filter((m) => m.id !== id));
  }

  // ── Cover image ──────────────────────────────────────
  function handleImageChange(file: File | null) {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Gallery images ───────────────────────────────────
  function addGalleryFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setGalleryFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setGalleryPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }
  function removeGalleryFile(i: number) {
    setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i));
    setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Tools ────────────────────────────────────────────
  function toggleTool(t: string) {
    setTools((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }
  function commitOtherTool() {
    const v = otherTool.trim();
    if (v && !tools.includes(v)) setTools((prev) => [...prev, v]);
    setOtherTool("");
  }

  // ── Build log ────────────────────────────────────────
  function updateLog(
    i: number,
    field: keyof LogEntry,
    value: string | boolean,
  ) {
    setLogEntries((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );
  }
  function handleLogImageChange(i: number, file: File | null) {
    if (!file) return;
    setLogEntryFiles((prev) => prev.map((f, idx) => (idx === i ? file : f)));
    const reader = new FileReader();
    reader.onload = (e) =>
      setLogEntryPreviews((prev) =>
        prev.map((p, idx) => (idx === i ? (e.target?.result as string) : p)),
      );
    reader.readAsDataURL(file);
  }
  function removeLogImage(i: number) {
    setLogEntryFiles((prev) => prev.map((f, idx) => (idx === i ? null : f)));
    setLogEntryPreviews((prev) => prev.map((p, idx) => (idx === i ? null : p)));
    updateLog(i, "image", "");
  }

  // ── BOM ──────────────────────────────────────────────
  function updateBom(i: number, field: keyof BomRow, value: string) {
    setBomRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  // ── Validation flash ─────────────────────────────────
  function flashField(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.animate(
      [
        { borderBottomColor: "var(--rule)" },
        { borderBottomColor: "#ff25c7" },
        { borderBottomColor: "var(--rule)" },
      ],
      { duration: 600, iterations: 2 },
    );
  }

  // ── Submit ───────────────────────────────────────────
  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!title.trim()) {
      flashField("f-title");
      return;
    }
    if (!blurb.trim()) {
      flashField("f-blurb");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const id = `${slug}-${Date.now().toString(36)}`;

    // Cover image
    let imageUrl: string | null = null;
    if (imageFile) {
      const shrunk = await compressForUpload(imageFile, "cover");
      const path = `${id}/cover.${shrunk.ext}`;
      const { error: uploadError } = await supabase.storage
        .from("Project Images")
        .upload(path, shrunk.blob, {
          upsert: true,
          contentType: shrunk.contentType,
        });
      if (uploadError) {
        setSubmitError(`Cover upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("Project Images").getPublicUrl(path);
      imageUrl = publicUrl;
    }

    // Gallery images
    const galleryUrls: string[] = [];
    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i];
      const shrunk = await compressForUpload(file, "inline");
      const path = `${id}/gallery/${i}.${shrunk.ext}`;
      const { error: gErr } = await supabase.storage
        .from("Project Images")
        .upload(path, shrunk.blob, {
          upsert: true,
          contentType: shrunk.contentType,
        });
      if (gErr) {
        setSubmitError(`Gallery image ${i + 1} failed: ${gErr.message}`);
        setSubmitting(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("Project Images").getPublicUrl(path);
      galleryUrls.push(publicUrl);
    }

    // Music & video
    const { media, error: mediaError } = await uploadMediaDrafts(
      id,
      mediaDrafts,
    );
    if (mediaError) {
      setSubmitError(mediaError);
      setSubmitting(false);
      return;
    }

    // Parse retro
    const retro_wins = retroWins
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const retro_fixes = retroFixes
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Parse build log
    const logImageUrls: (string | null)[] = [];
    for (let i = 0; i < logEntries.length; i++) {
      const file = logEntryFiles[i];
      if (file) {
        const shrunk = await compressForUpload(file, "inline");
        const path = `${id}/log/${Date.now()}-${i}.${shrunk.ext}`;
        const { error: lErr } = await supabase.storage
          .from("Project Images")
          .upload(path, shrunk.blob, {
            upsert: true,
            contentType: shrunk.contentType,
          });
        if (lErr) {
          setSubmitError(`Log image ${i + 1} failed: ${lErr.message}`);
          setSubmitting(false);
          return;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("Project Images").getPublicUrl(path);
        logImageUrls.push(publicUrl);
      } else {
        logImageUrls.push(null);
      }
    }
    const build_log = logEntries
      .filter((e) => e.title.trim())
      .map((e, i) => ({
        date: e.date || new Date().toISOString().split("T")[0],
        title: e.title.trim(),
        body: e.body.trim(),
        milestone: e.milestone,
        tag: e.tag.trim() || undefined,
        image: logImageUrls[i] || undefined,
      }));

    // Parse BOM
    const bom = bomRows
      .filter((r) => r.item.trim())
      .map((r) => ({
        item: r.item.trim(),
        desc: r.desc.trim() || undefined,
        qty: parseFloat(r.qty) || 1,
        unit_cost: parseFloat(r.unit_cost) || 0,
        src: r.src.trim() || undefined,
      }));

    const consentedCoMakers = coMakers.filter((m) => m.credit_consented);
    const anonCount = coMakers.filter((m) => !m.credit_consented).length;
    const makerNames = consentedCoMakers.map((m) => resolvePublicName(m));

    const payload: Record<string, unknown> = {
      id,
      title: title.trim(),
      category:
        category === "Other" ? otherCategory.trim() || "Other" : category,
      blurb: blurb.trim(),
      description: description.trim() || null,
      tools: tools.length > 0 ? tools : null,
      makers: makerNames,
      maker_ids: coMakers.length > 0 ? coMakers.map((m) => m.id) : null,
      anon_count: anonCount,
      github: github.trim() || null,
      website: website.trim() || null,
      image: imageUrl,
      status: "DRAFT",
      date: new Date().toISOString().split("T")[0],
      likes: 0,
      submitted_by: user!.id,
      start_date: startDate || null,
      build_time: buildTime.trim() || null,
      gallery_images: galleryUrls.length > 0 ? galleryUrls : null,
      build_log: build_log.length > 0 ? build_log : null,
      bom: bom.length > 0 ? bom : null,
      retro_wins: retro_wins.length > 0 ? retro_wins : null,
      retro_fixes: retro_fixes.length > 0 ? retro_fixes : null,
    };
    // Only sent when there's something to store, so an ordinary submission
    // still goes through on a database that hasn't had the media migration
    // (scripts/add-project-media.sql) applied yet.
    if (media) payload.media = media;

    const { error } = await supabase.from("Projects").insert(payload);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }

    // Persist consent preference change
    if (profile && !hideName !== (profile.credit_consented ?? true)) {
      supabase
        .from("profiles")
        .update({ credit_consented: !hideName })
        .eq("id", user!.id);
    }

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new-post",
        projectId: id,
        projectTitle: title.trim(),
        projectBlurb: blurb.trim(),
        projectCategory: category,
        makers: [
          profile?.display_name ?? user!.email!.split("@")[0],
          ...coMakers.map((m) => m.display_name),
        ],
      }),
    });

    setSent(true);
  }

  // Collapsed sections advertise what's already inside them, so nothing a
  // submitter filled in can hide behind a closed header.
  const storyBits = [
    description.trim() && "story",
    startDate && "dates",
    buildTime.trim() && "build time",
  ].filter(Boolean) as string[];
  const storySummary = storyBits.length > 0 ? storyBits.join(" · ") : undefined;
  const logCount = logEntries.filter((e) => e.title.trim()).length;
  const bomCount = bomRows.filter((r) => r.item.trim()).length;
  const retroCount = [
    ...retroWins.split("\n"),
    ...retroFixes.split("\n"),
  ].filter((l) => l.trim()).length;
  const linksCount = [github, website, contact].filter((v) => v.trim()).length;

  return (
    <div className={pageWrap}>
      <div className="pt-20">
        <header className={pageBand}>
          <Screentone />
          <Image src={solderingIron} alt="" className={`${pageBandDoodle} h-56 -bottom-16`} />
          <Link href="/projects" className={`${projectBack} relative z-[1] mb-2`}>
            ← Back to projects
          </Link>
          <p className={`${pageBandTitle} text-pop-pink`}>
            Submit a Project
          </p>
          <p className={pageBandSub}>
            Half-finished counts. Weird is good. Fill in what you know and
            we&rsquo;ll sort the rest.
          </p>
        </header>

      <main className={submitMain}>
        <div className={container}>
          <div className="grid grid-cols-[1fr_1.2fr] gap-16 items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">
            {/* ── Left: info ───────────────────── */}
            <div className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-6 md:p-8">
              <h3 className={`${secHead} text-pop-pink mb-5`}>What We Archive</h3>
              <p className="font-medium text-sm leading-[1.7] max-w-[46ch]">
                We log everything our members make — solo or group, finished or
                still in progress. Hardware, software, food, textiles, art. If
                you made it, it belongs here.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {[
                  "Made by a member (current or former)",
                  "Made during or inspired by an open hours / workshop",
                  "Any category, any finish level",
                  "Solo or group projects both welcome",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-[13px] font-semibold text-ink leading-[1.5]"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-black bg-pop-magenta text-white text-[10px] font-bold shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <h3 className={`${secHead} text-pop-violet mb-5 mt-12`}>The Numbers</h3>
              <div className="grid grid-cols-3 border-2 border-black rounded-[6px] overflow-hidden">
                <div className="px-4 py-3.5 border-r-2 border-black last:border-r-0">
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-ink-2">
                    In the archive
                  </div>
                  <div className="text-[22px] font-bold mt-1.5">{statsTotal ?? "—"}</div>
                </div>
                <div className="px-4 py-3.5 border-r-2 border-black last:border-r-0">
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-ink-2">
                    Added this year
                  </div>
                  <div className="text-[22px] font-bold mt-1.5">
                    {statsThisYear ?? "—"}
                  </div>
                </div>
                <div className="px-4 py-3.5 border-r-2 border-black last:border-r-0">
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-ink-2">
                    Members
                  </div>
                  <div className="text-[22px] font-bold mt-1.5">{memberTotal ?? "—"}</div>
                </div>
              </div>
            </div>

            {/* ── Right: form ──────────────────── */}
            <div>
              {!loading && !user ? (
                <div className={submitGate}>
                  <div className={submitGateIcon}>⚿</div>
                  <h2 className={submitGateH2}>Sign in to submit</h2>
                  <p className={submitGateP}>
                    You need an account to add a project to the archive. It only
                    takes a second.
                  </p>
                  <Link href="/login" className={`${btnGradient} mt-5`}>
                    Sign in <span className={btnArr}>→</span>
                  </Link>
                </div>
              ) : sent ? (
                <div className={submitSuccess}>
                  <div className={submitSuccessIcon}>★</div>
                  <h2 className={submitSuccessH2}>Filed!</h2>
                  <p className={submitSuccessP}>
                    Your project is in the queue. We review submissions every
                    Tuesday — if anything&rsquo;s unclear we&rsquo;ll reach out
                    on the contact you provided.
                  </p>
                  <Link href="/projects" className={`${btnGradient} mt-6`}>
                    Back to projects <span className={btnArr}>→</span>
                  </Link>
                </div>
              ) : (
                <div className={form}>
                  <div className={formInner}>
                    <span className={formFig}>
                      Project submission
                    </span>

                    {/* ── THE BASICS ──────────────────── */}
                    <h3 className={`${secHead} text-pop-blue mb-[18px] mt-1`}>
                      The Basics
                    </h3>

                    {/* Title */}
                    <div className={field}>
                      <label className={fieldLabel}>
                        Project title <span className={fieldReq}>*</span>
                      </label>
                      <input
                        className={fieldInput}
                        id="f-title"
                        type="text"
                        placeholder="e.g. Quokka Macropad"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div className={field}>
                      <label className={fieldLabel}>Category</label>
                      <CustomSelect
                        value={category}
                        onChange={(v) => {
                          setCategory(v);
                          if (v !== "Other") setOtherCategory("");
                        }}
                        options={[
                          ...categories.map((c) => ({ value: c, label: c })),
                          { value: "Other", label: "Other…" },
                        ]}
                      />
                      {category === "Other" && (
                        <input
                          className={`${fieldInput} mt-2`}
                          type="text"
                          placeholder="Describe the category"
                          value={otherCategory}
                          onChange={(e) => setOtherCategory(e.target.value)}
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Makers */}
                    <div className={field}>
                      <label className={fieldLabel}>
                        Makers / contributors
                      </label>
                      <div className={makersChips}>
                        <span className={makersChipYou}>
                          {profile?.display_name ?? user?.email?.split("@")[0]}
                          <span className={makersChipTag}>you</span>
                        </span>
                        {coMakers.map((m) => (
                          <span key={m.id} className={makersChip}>
                            {resolvePublicName(m)}
                            {!m.credit_consented && (
                              <span className="text-[9px] tracking-[0.1em] uppercase text-muted opacity-75">
                                anon
                              </span>
                            )}
                            <button
                              type="button"
                              className={makersChipRemove}
                              onClick={() => removeCoMaker(m.id)}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted mt-1.5 mb-2.5 leading-[1.5]">
                        You&rsquo;ll appear as{" "}
                        <strong className="text-ink">
                          {resolvePublicName({
                            display_name: profile?.display_name,
                            public_name: profile?.public_name,
                            name_preference: profile?.name_preference,
                          })}
                        </strong>
                        . Co-makers without credit enabled will show as
                        anonymous.{" "}
                        <a href="/dashboard" className="text-ink underline">
                          Change your name or privacy settings →
                        </a>
                      </p>
                      <div className={makersSearch}>
                        <input
                          className={fieldInput}
                          type="text"
                          placeholder="Search for a co-maker by name or username… They must have an account to be added"
                          autoComplete="off"
                          value={coMakerSearch}
                          onChange={(e) => {
                            setCoMakerSearch(e.target.value);
                            setShowCoMakerDropdown(true);
                          }}
                          onFocus={() => setShowCoMakerDropdown(true)}
                          onBlur={() =>
                            setTimeout(() => setShowCoMakerDropdown(false), 150)
                          }
                        />
                        {showCoMakerDropdown && coMakerSearch.trim() && (
                          <div className={makersDropdown}>
                            {coMakerResults.length > 0 ? (
                              coMakerResults.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  className={makersDropdownItem}
                                  onMouseDown={() => addCoMaker(r)}
                                >
                                  <span className={makersDropdownName}>
                                    {resolvePublicName(r)}
                                  </span>
                                  <span
                                    className={makersDropdownEmail}
                                    style={{
                                      color: r.credit_consented
                                        ? "var(--muted)"
                                        : "var(--pop-orange)",
                                    }}
                                  >
                                    {r.credit_consented
                                      ? r.email
                                      : "will appear anonymous"}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className={makersDropdownEmpty}>
                                No users found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* One-liner */}
                    <div className={field}>
                      <label className={fieldLabel}>
                        One-line description <span className={fieldReq}>*</span>
                        <span className="font-normal normal-case tracking-normal">
                          max 140 chars
                        </span>
                      </label>
                      <input
                        className={fieldInput}
                        id="f-blurb"
                        type="text"
                        maxLength={140}
                        placeholder="What did you make and what's interesting about it?"
                        value={blurb}
                        onChange={(e) => setBlurb(e.target.value)}
                      />
                    </div>

                    {/* Cover image */}
                    <div className={field}>
                      <label className={fieldLabel}>Cover photo</label>
                      <label
                        className={`${imgUploadBase} ${imagePreview ? imgUploadPreview : imgUploadIdle}`}
                        style={
                          imagePreview
                            ? { backgroundImage: `url(${imagePreview})` }
                            : undefined
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleImageChange(e.dataTransfer.files[0] ?? null);
                        }}
                      >
                        {!imagePreview && (
                          <span className={imgUploadInner}>
                            <span className={imgUploadIcon}>↑</span>
                            <span>Drop an image or click to browse</span>
                            <span className={imgUploadHint}>
                              JPG, PNG, WEBP · max 5 MB
                            </span>
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageChange(e.target.files?.[0] ?? null)
                          }
                        />
                        {imagePreview && (
                          <button
                            type="button"
                            className={`${imgUploadRemove} top-2 right-2`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleImageChange(null);
                            }}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </label>
                    </div>

                    {/* ── OPTIONAL EXTRAS ─────────────── */}
                    <div className={`${secHeadRow} mt-9`}>
                      <h3 className={`${secHead} text-pop-violet`}>Add More</h3>
                      <span className={secHint}>
                        all optional · open what you need
                      </span>
                    </div>
                    <p className="text-[12.5px] font-medium text-ink-2 leading-[1.55] mt-1.5 mb-1">
                      That&rsquo;s the required part done. Everything below is
                      extra — add what you&rsquo;ve got and skip the rest.
                    </p>

                    <FormSection
                      title="The Full Story"
                      colorClass="text-pop-blue"
                      blurb="How it started, what broke, what you're proud of."
                      summary={storySummary}
                    >
                      <div className={field}>
                        <label className={fieldLabel}>Tell the full story</label>
                        <textarea
                          className={`${fieldTextarea} min-h-[120px]`}
                          placeholder="How did it start? What was hard? What are you proud of? Anything goes."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <div className={fieldRow}>
                        <div className={field}>
                          <label className={fieldLabel}>
                            When did it start?
                          </label>
                          <input
                            className={fieldInput}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className={field}>
                          <label className={fieldLabel}>
                            How long did it take?
                          </label>
                          <input
                            className={fieldInput}
                            type="text"
                            placeholder="e.g. ~3 weeks"
                            value={buildTime}
                            onChange={(e) => setBuildTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </FormSection>

                    {/* Tools */}
                    <FormSection
                      title="Tools & Materials"
                      colorClass="text-pop-violet"
                      blurb="What you built it with. Becomes a filter on the archive."
                      summary={tools.length > 0 ? `${tools.length} picked` : undefined}
                    >
                      <div className={toolTags}>
                        {TOOL_SUGGESTIONS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={tools.includes(t) ? toolTagOn : toolTag}
                            onClick={() => toggleTool(t)}
                          >
                            {t}
                          </button>
                        ))}
                        {tools
                          .filter((t) => !TOOL_SUGGESTIONS.includes(t))
                          .map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={toolTagOn}
                              onClick={() => toggleTool(t)}
                            >
                              {t}
                            </button>
                          ))}
                        <span className={toolTagOther}>
                          <input
                            className={toolTagOtherInput}
                            type="text"
                            placeholder="Other…"
                            value={otherTool}
                            onChange={(e) => setOtherTool(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitOtherTool();
                              }
                            }}
                          />
                          {otherTool.trim() && (
                            <button
                              type="button"
                              className={toolTagOtherBtn}
                              onClick={commitOtherTool}
                            >
                              +
                            </button>
                          )}
                        </span>
                      </div>
                    </FormSection>

                    {/* ── MUSIC & VIDEO ───────────────── */}
                    <FormSection
                      title="Music & Video"
                      colorClass="text-pop-blue"
                      blurb="Upload a track, or link a YouTube/Vimeo video — then pick the moment previews start from."
                      summary={
                        mediaDrafts.length > 0
                          ? `${mediaDrafts.length} file${mediaDrafts.length === 1 ? "" : "s"}`
                          : undefined
                      }
                    >
                      <MediaUploader
                        items={mediaDrafts}
                        onChange={setMediaDrafts}
                      />
                    </FormSection>

                    {/* ── BUILD LOG ───────────────────── */}
                    <FormSection
                      title="Build Log"
                      colorClass="text-pop-violet"
                      blurb="A timeline of your process, entry by entry."
                      summary={
                        logCount > 0
                          ? `${logCount} ${logCount === 1 ? "entry" : "entries"}`
                          : undefined
                      }
                    >

                    {logEntries.length > 0 && (
                      <div className={dynList}>
                        {logEntries.map((entry, i) => (
                          <div key={i} className={dynRow}>
                            <button
                              type="button"
                              className={dynRowRemove}
                              onClick={() => {
                                setLogEntries((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                );
                                setLogEntryFiles((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                );
                                setLogEntryPreviews((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                );
                              }}
                            >
                              ✕
                            </button>
                            <div className={dynRowCols3}>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>Date</label>
                                <input
                                  className={fieldInput}
                                  type="date"
                                  value={entry.date}
                                  onChange={(e) =>
                                    updateLog(i, "date", e.target.value)
                                  }
                                />
                              </div>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>Title</label>
                                <input
                                  className={fieldInput}
                                  type="text"
                                  placeholder="e.g. First prototype"
                                  value={entry.title}
                                  onChange={(e) =>
                                    updateLog(i, "title", e.target.value)
                                  }
                                />
                              </div>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>Tag</label>
                                <input
                                  className={fieldInput}
                                  type="text"
                                  placeholder="e.g. Prototype"
                                  value={entry.tag}
                                  onChange={(e) =>
                                    updateLog(i, "tag", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className={fieldTight}>
                              <label className={fieldLabel}>Notes</label>
                              <textarea
                                className={`${fieldTextarea} min-h-[64px]`}
                                placeholder="What happened at this stage?"
                                value={entry.body}
                                onChange={(e) =>
                                  updateLog(i, "body", e.target.value)
                                }
                              />
                            </div>
                            <label className={dynRowMilestone}>
                              <input
                                className={dynRowMilestoneInput}
                                type="checkbox"
                                checked={entry.milestone}
                                onChange={(e) =>
                                  updateLog(i, "milestone", e.target.checked)
                                }
                              />
                              Mark as milestone
                            </label>
                            <div className={`${fieldTight} mt-2`}>
                              <label className={fieldLabel}>
                                Photo{" "}
                                <span className="font-normal normal-case tracking-normal">
                                  optional
                                </span>
                              </label>
                              {logEntryPreviews[i] ? (
                                <div className="relative inline-block">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={logEntryPreviews[i]!}
                                    alt="Log entry"
                                    className="max-w-full max-h-[200px] block rounded"
                                  />
                                  <button
                                    type="button"
                                    className={`${imgUploadRemove} top-1.5 right-1.5`}
                                    onClick={() => removeLogImage(i)}
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              ) : (
                                <label
                                  className={`${galleryUpload} inline-flex`}
                                >
                                  ↑ Add photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleLogImageChange(
                                        i,
                                        e.target.files?.[0] ?? null,
                                      )
                                    }
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className={dynAdd}
                      onClick={() => {
                        setLogEntries((prev) => [...prev, emptyLog()]);
                        setLogEntryFiles((prev) => [...prev, null]);
                        setLogEntryPreviews((prev) => [...prev, null]);
                      }}
                    >
                      + Add log entry
                    </button>
                    </FormSection>

                    {/* ── GALLERY ─────────────────────── */}
                    <FormSection
                      title="Photo Gallery"
                      colorClass="text-pop-magenta"
                      blurb="Process shots, close-ups, the messy bits."
                      summary={
                        galleryPreviews.length > 0
                          ? `${galleryPreviews.length} photo${galleryPreviews.length === 1 ? "" : "s"}`
                          : undefined
                      }
                    >

                    {galleryPreviews.length > 0 && (
                      <div className={galleryGrid}>
                        {galleryPreviews.map((src, i) => (
                          <div key={i} className={galleryThumb}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`Gallery ${i + 1}`}
                              className={galleryThumbImg}
                            />
                            <button
                              type="button"
                              className={galleryThumbRemove}
                              onClick={() => removeGalleryFile(i)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className={galleryUpload}>
                      ↑ Add photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addGalleryFiles(e.target.files)}
                      />
                    </label>
                    </FormSection>

                    {/* ── BOM ─────────────────────────── */}
                    <FormSection
                      title="Bill of Materials"
                      colorClass="text-pop-pink"
                      blurb="Parts, quantities and what it cost to build."
                      summary={
                        bomCount > 0
                          ? `${bomCount} item${bomCount === 1 ? "" : "s"}`
                          : undefined
                      }
                    >

                    {bomRows.length > 0 && (
                      <div className={dynList}>
                        {bomRows.map((row, i) => (
                          <div key={i} className={dynRow}>
                            <button
                              type="button"
                              className={dynRowRemove}
                              onClick={() =>
                                setBomRows((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                            >
                              ✕
                            </button>
                            <div className={dynRowCols4}>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>Item</label>
                                <input
                                  className={fieldInput}
                                  type="text"
                                  placeholder="e.g. Arduino Pro Mini"
                                  value={row.item}
                                  onChange={(e) =>
                                    updateBom(i, "item", e.target.value)
                                  }
                                />
                              </div>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>Qty</label>
                                <input
                                  className={fieldInput}
                                  type="number"
                                  min="1"
                                  value={row.qty}
                                  onChange={(e) =>
                                    updateBom(i, "qty", e.target.value)
                                  }
                                />
                              </div>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>
                                  Unit cost $
                                </label>
                                <input
                                  className={fieldInput}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={row.unit_cost}
                                  onChange={(e) =>
                                    updateBom(i, "unit_cost", e.target.value)
                                  }
                                />
                              </div>
                              <div className={fieldTight}>
                                <label className={fieldLabel}>Source</label>
                                <input
                                  className={fieldInput}
                                  type="text"
                                  placeholder="e.g. Jaycar"
                                  value={row.src}
                                  onChange={(e) =>
                                    updateBom(i, "src", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className={fieldTight}>
                              <label className={fieldLabel}>Description</label>
                              <input
                                className={fieldInput}
                                type="text"
                                placeholder="e.g. With pin headers"
                                value={row.desc}
                                onChange={(e) =>
                                  updateBom(i, "desc", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className={dynAdd}
                      onClick={() =>
                        setBomRows((prev) => [...prev, emptyBom()])
                      }
                    >
                      + Add item
                    </button>
                    </FormSection>

                    {/* ── RETRO ───────────────────────── */}
                    <FormSection
                      title="What We Learned"
                      colorClass="text-pop-red"
                      blurb="Honest notes — what worked, what you'd do differently. One per line."
                      summary={
                        retroCount > 0
                          ? `${retroCount} note${retroCount === 1 ? "" : "s"}`
                          : undefined
                      }
                    >
                    <div className={fieldRow}>
                      <div className={field}>
                        <label className={fieldLabel}>
                          What worked{" "}
                          <span className="text-[#22c55e]">[ + ]</span>
                        </label>
                        <textarea
                          className={`${fieldTextarea} min-h-[100px]`}
                          placeholder={
                            "Pin headers saved hours of debugging.\nPair-building at open hours was faster."
                          }
                          value={retroWins}
                          onChange={(e) => setRetroWins(e.target.value)}
                        />
                      </div>
                      <div className={field}>
                        <label className={fieldLabel}>
                          What we&rsquo;d change{" "}
                          <span className="text-pop-red">[ - ]</span>
                        </label>
                        <textarea
                          className={`${fieldTextarea} min-h-[100px]`}
                          placeholder={
                            "Should have ordered the PCB earlier.\nNeeds a service hatch."
                          }
                          value={retroFixes}
                          onChange={(e) => setRetroFixes(e.target.value)}
                        />
                      </div>
                    </div>
                    </FormSection>

                    {/* ── LINKS + CONTACT ─────────────── */}
                    <FormSection
                      title="Links & Contact"
                      colorClass="text-pop-orange"
                      blurb="Source code, a demo site, and how we can reach you."
                      summary={
                        linksCount > 0 ? `${linksCount} added` : undefined
                      }
                    >
                    <div className={fieldRow}>
                      <div className={field}>
                        <label className={fieldLabel}>GitHub / source</label>
                        <input
                          className={fieldInput}
                          type="url"
                          placeholder="https://github.com/…"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                        />
                      </div>
                      <div className={field}>
                        <label className={fieldLabel}>Demo / site</label>
                        <input
                          className={fieldInput}
                          type="url"
                          placeholder="https://…"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={field}>
                      <label className={fieldLabel}>Reach you at</label>
                      <input
                        className={fieldInput}
                        type="text"
                        placeholder="@discord, email, or Instagram — optional"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>
                    </FormSection>

                    {submitError && (
                      <p className="text-pop-red text-xs mt-2 tracking-[0.04em]">
                        {submitError}
                      </p>
                    )}
                    <div className={submitNotice}>
                      <p className={submitNoticeLine}>
                        <span className={submitNoticeIcon}>⚠</span>
                        <strong className="underline underline-offset-[3px]">
                          Your submission will be reviewed before it goes live.
                        </strong>
                      </p>
                      <p className={submitNoticeLine}>
                        <span className={submitNoticeIcon}>◈</span>
                        By submitting you consent to your project being
                        displayed publicly on the Makers Club archive.
                      </p>
                      <label className={submitNoticeConsent}>
                        <input
                          type="checkbox"
                          className={submitNoticeConsentInput}
                          checked={hideName}
                          onChange={(e) => setHideName(e.target.checked)}
                        />
                        <span className={submitNoticeConsentSpan}>
                          Hide my name on posts
                          <small className={submitNoticeConsentSmall}>
                            Check to be listed anonymously. This updates your
                            global name preference.
                          </small>
                        </span>
                      </label>
                    </div>
                    <div className={formActions}>
                      <button
                        className={btnGradient}
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? "Submitting…" : "Submit it"}{" "}
                        <span className={btnArr}>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
