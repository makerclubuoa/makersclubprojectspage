import sanitizeHtml from "sanitize-html";

// Sanitizes Ghost post HTML before it is rendered with dangerouslySetInnerHTML.
// sanitize-html is pure JS so it runs on Cloudflare Workers, unlike
// isomorphic-dompurify which requires jsdom (~11 MB and Node-only).
// `class` must be kept so Ghost's kg-* card markup stays styleable.
export function sanitizeGhostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "figure",
      "figcaption",
      "audio",
      "video",
      "source",
      "iframe",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
      audio: ["src", "controls", "preload"],
      video: ["src", "controls", "preload", "poster", "width", "height"],
      source: ["src", "srcset", "sizes", "type", "media"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "loading"],
    },
    // Ghost embed cards (Google Drive previews, YouTube, etc.) render as
    // iframes. Only trusted embed hosts are allowed through — this is admin-
    // authored CMS content, not user input, but the allowlist still bounds
    // what an iframe src can point at.
    allowedIframeHostnames: [
      "drive.google.com",
      "docs.google.com",
      "www.youtube.com",
      "player.vimeo.com",
    ],
    allowIframeRelativeUrls: false,
  });
}
