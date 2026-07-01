// Shared Tailwind class strings.
//
// These replace the reusable component classes that used to live in
// globals.css (.btn, .field, .seclabel, .container, .modal, .form …). They're
// kept here — rather than duplicated inline across every page — so the shared
// chrome stays consistent. globals.css now only carries design tokens, the
// base reset, keyframes and the JS-coordinated `.reveal` animation.

/* ── Layout ─────────────────────────────────────────── */
export const container =
  'max-w-[1320px] mx-auto px-7 max-[640px]:px-4 relative z-[1]'

/* ── Section label (e.g. “[03]  Projects  ────”) ─────── */
export const seclabel =
  'flex items-center gap-[14px] text-[11.5px] tracking-[0.12em] uppercase text-muted'
export const seclabelNum = 'text-ink font-semibold'
export const seclabelBar = 'flex-1 h-px bg-rule'
export const seclabelDot =
  'flex-1 h-px [background-image:linear-gradient(to_right,var(--rule)_50%,transparent_50%)] [background-size:6px_1px]'

/* ── Buttons ────────────────────────────────────────── */
export const btn =
  'inline-flex items-center justify-center gap-2.5 px-[22px] py-[11px] rounded-full font-semibold text-sm border border-ink active:scale-[0.97] [transition:transform_0.12s_ease,background_0.2s,color_0.2s,border-color_0.2s,opacity_0.2s]'
export const btnPrimary = `${btn} bg-ink text-paper hover:bg-paper hover:text-ink`
export const btnGhost = `${btn} bg-accent text-white border-transparent hover:opacity-85`
export const btnGradient = `${btn} bg-accent text-white border-transparent`
export const btnSecondary = `${btn} bg-accent text-white border-transparent hover:opacity-85`
export const btnDanger = `${btn} bg-pop-red text-white border-pop-red hover:opacity-85`
export const btnArr = 'text-sm leading-none'
export const btnDark =
  'inline-flex items-center justify-center gap-1.5 px-[22px] py-2.5 bg-[#2e2e2e] text-white rounded-full text-sm font-medium no-underline border border-white/12 transition-[background] duration-[180ms] hover:opacity-85'

/* ── Form fields ────────────────────────────────────── */
export const field = 'flex flex-col gap-1.5 mb-4'
export const fieldTight = 'flex flex-col gap-1.5' // field without the bottom margin
export const fieldLabel =
  'text-[10.5px] tracking-[0.12em] uppercase text-muted flex justify-between'
export const fieldReq = 'text-pop-magenta'
// input / select — underline style. (font: inherit comes from the base reset.)
export const fieldInput =
  'text-[13.5px] text-ink bg-transparent border-0 border-b border-rule py-2 outline-none w-full transition-[border-color] duration-200 focus:border-ink'
// textarea — boxed style.
export const fieldTextarea =
  'text-[13.5px] text-ink bg-transparent border border-rule p-2.5 outline-none w-full min-h-[90px] resize-y transition-[border-color] duration-200 focus:border-ink'
export const fieldRow = 'grid grid-cols-2 gap-[14px] max-[640px]:grid-cols-1'

/* ── Form shell ─────────────────────────────────────── */
export const form = 'border border-rule bg-paper p-1'
export const formInner = 'border border-dashed border-rule p-[26px] relative'
// the little “FIG.0x — …” tab that used to be a ::before on .form__inner
export const formFig =
  'absolute -top-[9px] left-[18px] bg-paper px-2 text-[10px] tracking-[0.12em] text-muted'

/* ── Form actions row (footer of a form) ────────────── */
export const formActions =
  'flex items-center justify-between mt-[22px] pt-4 border-t border-dashed border-rule gap-[14px] flex-wrap'
export const formActionsSmall = 'text-[11px] text-muted'

/* ── Type-picker pills ──────────────────────────────── */
export const typepick = 'flex flex-wrap gap-[5px]'
export const typepickBtn =
  'px-[11px] py-1.5 border border-rule bg-paper text-[11px] tracking-[0.06em] uppercase text-ink-2 transition-all duration-150'
export const typepickBtnOn = 'bg-ink text-paper border-ink'

/* ── Submit / dashboard hero ────────────────────────── */
export const submitHero =
  'pt-[120px] pb-[60px] border-b border-rule max-[640px]:pt-[88px]'
export const submitHeroTitle =
  'text-[clamp(40px,6.5vw,88px)] leading-[0.94] font-normal tracking-[-0.01em] mt-0 mb-6 [text-wrap:balance]'
export const submitHeroSub = 'text-ink-2 text-[15px] max-w-[52ch] m-0 leading-[1.65]'
export const submitMain = 'pt-[60px] pb-[100px]'

/* ── Dashboard / admin table ────────────────────────── */
export const dashTable = 'flex flex-col border border-rule'
export const dashRow =
  'flex items-center gap-4 px-[18px] py-3.5 border-b border-rule-2 transition-colors duration-150 last:border-b-0 hover:bg-paper-2'
export const dashRowMain = 'flex-1 min-w-0 flex flex-col gap-[3px]'
export const dashRowTitle =
  'text-base font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-150 hover:text-pop-magenta'
export const dashRowMeta = 'text-[10.5px] tracking-[0.08em] uppercase text-muted'
// base carries width-only border; the variant supplies the border color.
export const dashStatus =
  'text-[10px] tracking-[0.1em] uppercase px-[9px] py-1 border whitespace-nowrap shrink-0'
export const dashStatusDraft = 'border-rule text-muted'
export const dashStatusLive =
  'border-pop-blue text-pop-blue bg-[color-mix(in_oklab,var(--pop-blue)_8%,var(--paper))]'
export const dashStatusRejected =
  'border-pop-red text-pop-red bg-[color-mix(in_oklab,var(--pop-red)_8%,var(--paper))]'
export const dashStatusLiked =
  'border-pop-magenta text-pop-magenta bg-[color-mix(in_oklab,var(--pop-magenta)_8%,var(--paper))]'
export const dashStatusComaker =
  'border-pop-violet text-pop-violet bg-[color-mix(in_oklab,var(--pop-violet)_8%,var(--paper))]'
export const dashRowEdit =
  'text-[10.5px] tracking-[0.08em] uppercase text-pop-blue shrink-0 px-2 py-1 transition-colors duration-150 hover:text-pop-violet'
export const dashRowDelete =
  'text-[10.5px] tracking-[0.08em] uppercase text-muted shrink-0 px-2 py-1 transition-colors duration-150 hover:text-pop-red'

/* ── Modal ──────────────────────────────────────────── */
export const modalBackdrop =
  'fixed inset-0 z-[1000] bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-6'
export const modal =
  'bg-paper border border-rule rounded-base p-7 pb-6 max-w-[420px] w-full shadow-[0_24px_64px_rgba(0,0,0,0.32)]'
export const modalLabel =
  'text-[10px] tracking-[0.12em] uppercase text-muted mb-2.5'
export const modalTitle = 'text-base text-ink mb-2 leading-[1.4]'
export const modalWarn = 'text-xs text-pop-red mb-5'
export const modalActions = 'flex gap-2 justify-end mt-6'

/* ── Empty state ────────────────────────────────────── */
export const emptyState = 'p-[60px] text-center text-muted'
export const emptyStateMono = 'font-mono text-[11px] tracking-[0.1em] uppercase'

/* ── Photo placeholder (cards + covers) ─────────────── */
export const ph =
  "absolute inset-0 flex items-end justify-start p-2.5 text-[10px] tracking-[0.04em] text-white/[0.92] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:[background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0_6px,transparent_6px_14px)]"
export const phLabel = 'relative z-[1] opacity-95 uppercase'

/* ── Back link (project pages) ──────────────────────── */
export const projectBack =
  'inline-flex items-center gap-2 text-[10.5px] tracking-[0.14em] uppercase text-ink-2 mb-7 no-underline transition-colors duration-200 hover:text-ink'

/* ─────────────────────────────────────────────────────
   Submit / edit form widgets (shared by both pages)
   ───────────────────────────────────────────────────── */

/* Co-makers */
export const makersChips = 'flex flex-wrap gap-1.5 mb-2.5 min-h-[28px]'
export const makersChip =
  'inline-flex items-center gap-[7px] px-2.5 py-1 border border-rule bg-paper-2 text-xs tracking-[0.04em]'
export const makersChipYou =
  'inline-flex items-center gap-[7px] px-2.5 py-1 border border-pop-magenta bg-[color-mix(in_oklab,var(--pop-magenta)_8%,var(--paper))] text-xs tracking-[0.04em]'
export const makersChipAdd =
  'inline-flex items-center gap-[7px] px-2.5 py-1 border border-dashed border-rule bg-paper-2 text-xs tracking-[0.04em] text-muted cursor-pointer transition-[color,border-color] duration-150 hover:text-ink hover:border-ink-2'
export const makersChipTag = 'text-[9px] tracking-[0.1em] uppercase text-pop-magenta opacity-75'
export const makersChipRemove =
  'text-[10px] text-muted p-0 leading-none transition-colors duration-150 hover:text-pop-red'
export const makersSearch = 'relative'
export const makersDropdown =
  'absolute top-full left-0 right-0 bg-paper border border-rule border-t-0 z-20 max-h-[220px] overflow-y-auto shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]'
export const makersDropdownItem =
  'flex items-center justify-between gap-3 w-full px-3.5 py-2.5 text-left border-b border-rule-2 transition-colors duration-150 hover:bg-paper-2'
export const makersDropdownName = 'text-[12.5px] text-ink'
export const makersDropdownEmail =
  'text-[10.5px] text-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[16ch]'
export const makersDropdownEmpty =
  'px-3.5 py-3 text-[11px] text-muted tracking-[0.08em] uppercase'

/* Image upload */
export const imgUploadBase =
  'flex items-center justify-center border bg-paper-2 cursor-pointer transition-[border-color,background] duration-200 relative overflow-hidden bg-cover bg-center hover:border-ink hover:bg-paper-3'
export const imgUploadIdle = 'min-h-[140px] border-dashed border-rule'
export const imgUploadPreview = 'min-h-[200px] border-solid border-rule'
export const imgUploadInner =
  'flex flex-col items-center gap-1.5 text-xs tracking-[0.06em] uppercase text-muted pointer-events-none p-6 text-center'
export const imgUploadIcon = 'text-[22px] leading-none mb-1 text-ink-2'
export const imgUploadHint = 'text-[10px] opacity-60 mt-0.5'
// position (top/right) is applied per use site to avoid override conflicts
export const imgUploadRemove =
  'absolute px-2.5 py-1 bg-black/65 text-white text-[10.5px] tracking-[0.06em] uppercase border-none cursor-pointer transition-[background] duration-200 backdrop-blur-[4px] hover:bg-[rgba(255,60,109,0.85)]'

/* Tool tags */
export const toolTags = 'flex flex-wrap gap-1.5 mt-2.5 items-center'
export const toolTag =
  'px-2.5 py-[5px] border border-rule bg-paper text-ink-2 text-[11px] tracking-[0.05em] cursor-pointer rounded-[3px] transition-[border-color,color,background] duration-150 hover:border-ink hover:text-ink'
export const toolTagOn =
  'px-2.5 py-[5px] border border-ink bg-ink text-paper text-[11px] tracking-[0.05em] cursor-pointer rounded-[3px] transition-[border-color,color,background] duration-150 hover:opacity-75'
export const toolTagOther =
  'inline-flex items-center gap-1 border border-rule rounded-[3px] pl-2 pr-1 bg-paper'
export const toolTagOtherInput =
  'border-none bg-transparent text-ink text-[11px] w-20 py-[5px] outline-none placeholder:text-muted'
export const toolTagOtherBtn =
  'border-none bg-transparent text-muted text-sm cursor-pointer px-1 py-0.5 leading-none transition-colors duration-150 hover:text-ink'

/* Dynamic list rows (build log / BOM) */
export const dynList = 'flex flex-col gap-2.5 mb-2'
export const dynRow = 'border border-rule px-3.5 py-3 bg-paper-2 relative flex flex-col gap-2'
export const dynRowRemove =
  'absolute top-2 right-2 text-[11px] text-muted px-1.5 py-0.5 transition-colors duration-150 hover:text-pop-red'
export const dynRowCols3 = 'grid gap-2 grid-cols-3 max-[640px]:grid-cols-1'
export const dynRowCols4 = 'grid gap-2 grid-cols-[2fr_60px_90px_1fr] max-[640px]:grid-cols-1'
export const dynRowMilestone =
  'inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] uppercase text-muted cursor-pointer'
export const dynRowMilestoneInput = 'w-auto border border-rule px-1 py-0.5 cursor-pointer'
export const dynAdd =
  'inline-flex items-center gap-1.5 px-3 py-[7px] border border-dashed border-rule text-[11px] tracking-[0.08em] uppercase text-muted transition-[border-color,color] duration-150 hover:border-ink hover:text-ink'

/* Gallery upload */
export const galleryUpload =
  'border border-dashed border-rule bg-paper-2 p-4 cursor-pointer transition-[border-color] duration-200 flex items-center justify-center gap-2 text-[11.5px] tracking-[0.08em] uppercase text-muted hover:border-ink hover:text-ink'
export const galleryGrid = 'grid grid-cols-3 gap-1.5 mb-2'
export const galleryThumb = 'relative aspect-[4/3] overflow-hidden border border-rule'
export const galleryThumbImg = 'w-full h-full object-cover block'
export const galleryThumbRemove =
  'absolute top-1 right-1 bg-black/65 text-white border-none text-[10px] px-1.5 py-0.5 cursor-pointer leading-[1.4] hover:bg-[rgba(255,60,109,0.85)]'

/* Submit notice (consent + review warning) */
export const submitNotice =
  'border border-rule border-l-[3px] border-l-accent bg-paper-2 px-[18px] py-4 mb-5 flex flex-col gap-2.5'
export const submitNoticeLine =
  'm-0 text-[13.5px] leading-[1.5] text-ink flex gap-2.5 items-baseline'
export const submitNoticeIcon = 'shrink-0 text-accent text-[13px]'
export const submitNoticeConsent =
  'flex items-start gap-2.5 cursor-pointer pt-1 border-t border-rule mt-1'
export const submitNoticeConsentInput = 'mt-0.5 shrink-0 w-auto'
export const submitNoticeConsentSpan = 'flex flex-col gap-0.5 text-[13px] text-ink'
export const submitNoticeConsentSmall = 'text-[11px] text-muted'

/* Auth gate + success panels */
export const submitGate = 'border border-rule py-14 px-9 text-center bg-paper-2'
export const submitGateIcon = 'text-[36px] text-muted mb-4'
export const submitGateH2 = 'text-[28px] font-normal mt-0 mb-2.5'
export const submitGateP = 'text-ink-2 text-[13.5px] max-w-[38ch] mx-auto leading-[1.6]'
export const submitSuccess =
  'border border-pop-magenta py-12 px-9 text-center bg-[color-mix(in_oklab,var(--pop-magenta)_7%,var(--paper))]'
export const submitSuccessIcon = 'text-[36px] text-pop-magenta mb-4'
export const submitSuccessH2 = 'text-[32px] font-normal mt-0 mb-3'
export const submitSuccessP = 'text-ink-2 text-sm max-w-[44ch] mx-auto leading-[1.6]'
