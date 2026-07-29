// Shared Tailwind class strings.
//
// These carry the site-wide comic-pop design language (the homepage / events
// look): chunky black borders, hard offset shadows, rounded pills, pop
// colours, and Holtwood display headings with a black stroke. They're kept
// here — rather than duplicated inline across every page — so the shared
// chrome stays consistent. globals.css only carries design tokens, the base
// reset, keyframes and the JS-coordinated `.reveal` animation.

/* ── Layout ─────────────────────────────────────────── */
export const container =
  "max-w-[1320px] mx-auto px-7 max-[640px]:px-4 relative z-[1]";

/* ── Comic display heading (Holtwood + black stroke) ── */
// Colour is supplied per use site (text-white, text-pop-blue, …).
export const holt =
  "font-holt font-bold text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill]";

/* ── Page shell (gradient page + white banner band) ─── */
// Blue gradient base — the projects-area identity (events owns purple).
export const pageWrap = "bg-blue-grad min-h-dvh";
// relative + overflow-hidden so bands can carry Screentone dots / doodle art;
// title & sub sit above the decorations via z-[1].
export const pageBand =
  "relative overflow-hidden flex flex-col justify-center gap-1 border-y-4 bg-white min-h-36 py-10 px-5 md:px-10";
export const pageBandTitle = `${holt} relative z-[1] text-4xl md:text-5xl`;
export const pageBandSub = "relative z-[1] text-md md:text-lg font-semibold";
// doodle art pinned to the right edge of a band (decorative, behind content)
export const pageBandDoodle =
  "hidden md:block absolute -right-4 -bottom-10 h-44 w-auto rotate-[12deg] pointer-events-none select-none";

/* ── Section heading (comic display + optional hint) ── */
// Usage: <div className={secHeadRow}><h3 className={`${secHead} text-pop-…`}>Label</h3><span className={secHint}>hint</span></div>
export const secHeadRow =
  "flex items-baseline justify-between gap-x-4 gap-y-1 flex-wrap";
export const secHead = `${holt} text-xl md:text-2xl m-0`;
export const secHint =
  "text-[11px] font-semibold text-ink-2 uppercase tracking-[0.06em] max-[640px]:hidden";

/* ── Buttons ────────────────────────────────────────── */
export const btn =
  "inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-semibold text-sm md:text-base border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow,opacity,background-color] duration-100 disabled:opacity-60";
export const btnPrimary = `${btn} bg-black text-white hover:opacity-90`;
export const btnGhost = `${btn} bg-white text-black hover:bg-paper-2`;
export const btnGradient = `${btn} bg-white text-black hover:opacity-90`;
export const btnSecondary = `${btn} bg-pop-violet text-white hover:opacity-90`;
export const btnDanger = `${btn} bg-pop-red text-white hover:opacity-90`;
export const btnArr = "text-sm leading-none";
export const btnDark = `${btn} bg-[#2e2e2e] text-white hover:opacity-90`;

/* ── Form fields ────────────────────────────────────── */
export const field = "flex flex-col gap-1.5 mb-4";
export const fieldTight = "flex flex-col gap-1.5"; // field without the bottom margin
export const fieldLabel =
  "text-[11px] font-bold tracking-[0.1em] uppercase text-ink flex justify-between";
export const fieldReq = "text-pop-magenta";
// input / select — boxed comic style. (font: inherit comes from the base reset.)
export const fieldInput =
  "text-sm text-ink bg-white border-2 border-black rounded-[6px] px-3 py-2 outline-none w-full transition-shadow duration-150 focus:shadow-[2px_2px_0px_0px_#000] placeholder:text-muted";
export const fieldTextarea = `${fieldInput} min-h-[90px] resize-y`;
export const fieldRow = "grid grid-cols-2 gap-[14px] max-[640px]:grid-cols-1";

/* ── Form shell ─────────────────────────────────────── */
export const form =
  "bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] relative";
export const formInner = "p-[26px] relative max-[640px]:p-4";
// sticker-style label pinned to the top of the card
export const formFig =
  "absolute -top-[15px] left-[18px] z-10 bg-pop-violet text-white border-2 border-black rounded-full px-3.5 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase -rotate-2 shadow-[2px_2px_0px_0px_#000]";

/* ── Form actions row (footer of a form) ────────────── */
export const formActions =
  "flex items-center justify-between mt-[22px] pt-4 border-t-2 border-black/10 gap-[14px] flex-wrap";
export const formActionsSmall = "text-[11px] font-semibold text-ink-2";

/* ── Type-picker pills ──────────────────────────────── */
export const typepick = "flex flex-wrap gap-1.5";
export const typepickBtn =
  "px-3 py-1 rounded-full border-2 border-black bg-white text-[11px] font-semibold tracking-[0.06em] uppercase text-ink transition-all duration-150 hover:bg-paper-2";
export const typepickBtnOn =
  "bg-black text-white shadow-[2px_2px_0px_0px_#000]";

/* ── Submit / dashboard main area ───────────────────── */
export const submitMain = "pt-[50px] pb-[100px]";

/* ── Dashboard / admin table ────────────────────────── */
export const dashTable =
  "flex flex-col bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000]";
export const dashRow =
  "flex items-center gap-4 px-[18px] py-3.5 border-b-2 border-black/10 transition-colors duration-150 last:border-b-0 hover:bg-paper-2";
export const dashRowMain = "flex-1 min-w-0 flex flex-col gap-[3px]";
export const dashRowTitle =
  "text-base font-bold text-ink whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-150 hover:text-pop-magenta";
export const dashRowMeta =
  "text-[10.5px] font-semibold tracking-[0.08em] uppercase text-ink-2";
// base carries shape; the variant supplies the colours.
export const dashStatus =
  "text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-0.5 rounded-full border-2 border-black whitespace-nowrap shrink-0";
export const dashStatusDraft = "bg-paper-2 text-ink";
export const dashStatusLive = "bg-pop-blue text-white";
export const dashStatusRejected = "bg-pop-red text-white";
export const dashStatusLiked = "bg-pop-magenta text-white";
export const dashStatusComaker = "bg-pop-violet text-white";
export const dashRowEdit =
  "text-[10.5px] font-bold tracking-[0.08em] uppercase text-pop-blue shrink-0 px-2 py-1 transition-colors duration-150 hover:text-pop-violet";
export const dashRowDelete =
  "text-[10.5px] font-bold tracking-[0.08em] uppercase text-ink-2 shrink-0 px-2 py-1 transition-colors duration-150 hover:text-pop-red";

/* ── Modal ──────────────────────────────────────────── */
export const modalBackdrop =
  "fixed inset-0 z-[1000] bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-6";
export const modal =
  "bg-white outline-solid outline-3 outline-black p-7 pb-6 max-w-[420px] w-full shadow-[6px_6px_0px_0px_#000]";
export const modalLabel =
  "text-[10px] font-bold tracking-[0.12em] uppercase text-pop-violet mb-2.5";
export const modalTitle = "text-lg font-bold text-ink mb-2 leading-[1.4]";
export const modalWarn = "text-xs font-semibold text-pop-red mb-5";
export const modalActions = "flex gap-2.5 justify-end mt-6";

/* ── Empty state ────────────────────────────────────── */
export const emptyState =
  "p-[60px] text-center font-semibold text-ink bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000]";
export const emptyStateMono =
  "text-[12px] font-bold tracking-[0.1em] uppercase";

/* ── Photo placeholder (cards + covers) ─────────────── */
export const ph =
  "absolute inset-0 flex items-end justify-start p-2.5 text-[11px] font-bold tracking-[0.04em] text-white/[0.92] bg-cover bg-center";
export const phLabel = "relative z-[1] opacity-95 uppercase";

/* ── Back link (project pages) ──────────────────────── */
export const projectBack =
  "inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase mb-7 no-underline transition-colors duration-200 hover:text-pop-magenta";

/* ─────────────────────────────────────────────────────
   Submit / edit form widgets (shared by both pages)
   ───────────────────────────────────────────────────── */

/* Co-makers */
export const makersChips = "flex flex-wrap gap-1.5 mb-2.5 min-h-[28px]";
export const makersChip =
  "inline-flex items-center gap-[7px] px-3 py-1 rounded-full border-2 border-black bg-white text-xs font-semibold tracking-[0.04em]";
export const makersChipYou =
  "inline-flex items-center gap-[7px] px-3 py-1 rounded-full border-2 border-black bg-pop-magenta text-white text-xs font-semibold tracking-[0.04em] shadow-[2px_2px_0px_0px_#000]";
export const makersChipAdd =
  "inline-flex items-center gap-[7px] px-3 py-1 rounded-full border-2 border-dashed border-black bg-white text-xs font-semibold tracking-[0.04em] text-ink-2 cursor-pointer transition-colors duration-150 hover:text-ink hover:bg-paper-2";
export const makersChipTag =
  "text-[9px] font-bold tracking-[0.1em] uppercase opacity-80";
export const makersChipRemove =
  "text-[10px] p-0 leading-none opacity-70 transition-opacity duration-150 hover:opacity-100";
export const makersSearch = "relative";
export const makersDropdown =
  "absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-[6px] z-20 max-h-[220px] overflow-y-auto shadow-[4px_4px_0px_0px_#000]";
export const makersDropdownItem =
  "flex items-center justify-between gap-3 w-full px-3.5 py-2.5 text-left border-b-2 border-black/10 transition-colors duration-150 last:border-b-0 hover:bg-paper-2";
export const makersDropdownName = "text-[12.5px] font-semibold text-ink";
export const makersDropdownEmail =
  "text-[10.5px] text-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[16ch]";
export const makersDropdownEmpty =
  "px-3.5 py-3 text-[11px] font-bold text-ink-2 tracking-[0.08em] uppercase";

/* Image upload */
export const imgUploadBase =
  "flex items-center justify-center border-2 bg-paper-2 rounded-[6px] cursor-pointer transition-[background,box-shadow] duration-200 relative overflow-hidden bg-cover bg-center hover:bg-paper-3 hover:shadow-[2px_2px_0px_0px_#000]";
export const imgUploadIdle = "min-h-[140px] border-dashed border-black";
export const imgUploadPreview = "min-h-[200px] border-solid border-black";
export const imgUploadInner =
  "flex flex-col items-center gap-1.5 text-xs font-bold tracking-[0.06em] uppercase text-ink-2 pointer-events-none p-6 text-center";
export const imgUploadIcon = "text-[22px] leading-none mb-1 text-ink";
export const imgUploadHint = "text-[10px] opacity-60 mt-0.5";
// position (top/right) is applied per use site to avoid override conflicts
export const imgUploadRemove =
  "absolute px-2.5 py-1 rounded-full border-2 border-black bg-black/70 text-white text-[10px] font-bold tracking-[0.06em] uppercase cursor-pointer transition-[background] duration-200 backdrop-blur-[4px] hover:bg-pop-red";

/* Tool tags */
export const toolTags = "flex flex-wrap gap-1.5 mt-2.5 items-center";
export const toolTag =
  "px-3 py-1 rounded-full border-2 border-black bg-white text-ink text-[11px] font-semibold tracking-[0.05em] cursor-pointer transition-[background,box-shadow] duration-150 hover:bg-paper-2";
export const toolTagOn =
  "px-3 py-1 rounded-full border-2 border-black bg-pop-violet text-white text-[11px] font-semibold tracking-[0.05em] cursor-pointer shadow-[2px_2px_0px_0px_#000] transition-[background,box-shadow] duration-150 hover:opacity-85";
export const toolTagOther =
  "inline-flex items-center gap-1 rounded-full border-2 border-black pl-3 pr-1.5 bg-white";
export const toolTagOtherInput =
  "border-none bg-transparent text-ink text-[11px] font-semibold w-20 py-1 outline-none placeholder:text-muted";
export const toolTagOtherBtn =
  "border-none bg-transparent text-ink-2 text-sm font-bold cursor-pointer px-1 py-0.5 leading-none transition-colors duration-150 hover:text-ink";

/* Dynamic list rows (build log / BOM) */
export const dynList = "flex flex-col gap-2.5 mb-2";
export const dynRow =
  "border-2 border-black rounded-[6px] px-3.5 py-3 bg-paper-2 relative flex flex-col gap-2";
export const dynRowRemove =
  "absolute top-2 right-2 text-[11px] font-bold text-ink-2 px-1.5 py-0.5 transition-colors duration-150 hover:text-pop-red";
export const dynRowCols3 = "grid gap-2 grid-cols-3 max-[640px]:grid-cols-1";
export const dynRowCols4 =
  "grid gap-2 grid-cols-[2fr_60px_90px_1fr] max-[640px]:grid-cols-1";
export const dynRowMilestone =
  "inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.06em] uppercase text-ink cursor-pointer";
export const dynRowMilestoneInput =
  "w-auto border-2 border-black px-1 py-0.5 cursor-pointer accent-pop-magenta";
export const dynAdd =
  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-dashed border-black bg-white text-[11px] font-bold tracking-[0.08em] uppercase text-ink transition-colors duration-150 hover:bg-paper-2";

/* Gallery upload */
export const galleryUpload =
  "rounded-[6px] border-2 border-dashed border-black bg-paper-2 p-4 cursor-pointer transition-[background] duration-200 flex items-center justify-center gap-2 text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink hover:bg-paper-3";
export const galleryGrid = "grid grid-cols-3 gap-1.5 mb-2";
export const galleryThumb =
  "relative aspect-[4/3] overflow-hidden border-2 border-black rounded-[6px]";
export const galleryThumbImg = "w-full h-full object-cover block";
export const galleryThumbRemove =
  "absolute top-1 right-1 rounded-full border-2 border-black bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 cursor-pointer leading-[1.4] hover:bg-pop-red";

/* Submit notice (consent + review warning) */
export const submitNotice =
  "border-2 border-black border-l-8 border-l-pop-pink bg-paper-2 px-[18px] py-4 mb-5 flex flex-col gap-2.5 rounded-[6px]";
export const submitNoticeLine =
  "m-0 text-[13.5px] font-medium leading-[1.5] text-ink flex gap-2.5 items-baseline";
export const submitNoticeIcon = "shrink-0 text-pop-pink text-[13px]";
export const submitNoticeConsent =
  "flex items-start gap-2.5 cursor-pointer pt-2 border-t-2 border-black/10 mt-1";
export const submitNoticeConsentInput =
  "mt-0.5 shrink-0 w-auto accent-pop-magenta";
export const submitNoticeConsentSpan =
  "flex flex-col gap-0.5 text-[13px] font-semibold text-ink";
export const submitNoticeConsentSmall = "text-[11px] font-medium text-ink-2";

/* Auth gate + success panels */
export const submitGate =
  "bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] py-14 px-9 text-center";
export const submitGateIcon = "text-[36px] text-pop-violet mb-4";
export const submitGateH2 = `${holt} text-2xl md:text-3xl text-pop-violet mt-0 mb-2.5`;
export const submitGateP =
  "text-ink-2 font-semibold text-[13.5px] max-w-[38ch] mx-auto leading-[1.6]";
export const submitSuccess =
  "bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] py-12 px-9 text-center";
export const submitSuccessIcon = "text-[36px] text-pop-magenta mb-4";
export const submitSuccessH2 = `${holt} text-2xl md:text-3xl text-pop-magenta mt-0 mb-3`;
export const submitSuccessP =
  "text-ink-2 font-semibold text-sm max-w-[44ch] mx-auto leading-[1.6]";
