"use client"

import DOMPurify from "dompurify"

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["a", "b", "blockquote", "br", "code", "details", "div", "em", "h1", "h2", "h3", "h4", "hr", "i", "li", "ol", "p", "pre", "span", "strong", "summary", "u", "ul"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  })
}
