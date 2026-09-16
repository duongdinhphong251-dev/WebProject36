"use client";

import { useState, useEffect } from "react";

/**
 * DealDescription — renders deal short/full description.
 *
 * Detection logic:
 *  - If the text starts with a HTML tag (<p>, <ul>, <div>, <br>, <h…> etc.)
 *    it is treated as HTML and rendered via dangerouslySetInnerHTML.
 *  - Otherwise it is rendered as plain pre-wrapped text.
 *
 * XSS safety:
 *  - Only a strict allowlist of tags/attributes is kept.
 *  - All event handlers (on*), <script>, <iframe>, <object>, javascript:
 *    hrefs and data: URIs are stripped before mounting.
 */

const ALLOWED_TAGS =
  /^(p|br|ul|ol|li|strong|b|em|i|h[1-6]|span|div|a|blockquote|pre|code|table|thead|tbody|tr|td|th|hr)$/i;

const DANGEROUS_ATTR = /^(on\w+|srcdoc|action|formaction)$/i;
const DANGEROUS_HREF = /^\s*(javascript:|data:)/i;

function sanitizeHtml(raw: string): string {
  // Server-render guard — DOMParser is browser-only
  if (typeof window === "undefined") return "";

  const doc = new DOMParser().parseFromString(raw, "text/html");

  function walk(node: Node) {
    const toRemove: Node[] = [];

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();

        // Strip disallowed tags entirely (keep children for block wrappers)
        if (!ALLOWED_TAGS.test(tag)) {
          // Replace with its text content
          const text = doc.createTextNode(el.textContent ?? "");
          node.insertBefore(text, el);
          toRemove.push(el);
          return;
        }

        // Strip dangerous attributes
        Array.from(el.attributes).forEach((attr) => {
          if (DANGEROUS_ATTR.test(attr.name)) {
            el.removeAttribute(attr.name);
          } else if (attr.name === "href" && DANGEROUS_HREF.test(attr.value)) {
            el.removeAttribute("href");
          } else if (attr.name === "src" && DANGEROUS_HREF.test(attr.value)) {
            el.removeAttribute("src");
          }
        });

        walk(el);
      }
    });

    toRemove.forEach((n) => node.removeChild(n));
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

const HTML_START_RE = /^\s*<[a-zA-Z]/;

function isHtml(text: string): boolean {
  return HTML_START_RE.test(text);
}

/** Chuyển literal "\n" (2 ký tự backslash + n) thành newline thật */
function normalizeNewlines(text: string): string {
  return text.replace(/\\n/g, "\n");
}

interface DealDescriptionProps {
  short: string;
  fullTrim: string;
  sameBody: boolean;
}

function DescBlock({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isHtml(text)) {
    return (
      <div
        className={`prose max-w-none [&_p]:text-[13px] [&_p]:text-[#093E06] [&_li]:text-[13px] [&_li]:text-[#093E06] [&_span]:text-[13px] [&_span]:text-[#093E06] [&_*]:text-[#093E06] ${className}`}
        // sanitizeHtml strips scripts/events — safe for user-generated HTML
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: isMounted ? sanitizeHtml(text) : "" }}
      />
    );
  }
  // normalizeNewlines: đảm bảo literal "\n" từ backend → newline thật
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {normalizeNewlines(text)}
    </p>
  );
}

export function DealDescription({ short, fullTrim, sameBody }: DealDescriptionProps) {
  if (sameBody) {
    return (
      <DescBlock
        text={short}
        className="text-[13px] leading-relaxed text-[#093E06]"
      />
    );
  }

  return (
    <>
      {short ? (
        <DescBlock
          text={short}
          className="mb-3 text-[13px] font-medium leading-relaxed text-[#093E06]"
        />
      ) : null}
      {fullTrim ? (
        <DescBlock
          text={fullTrim}
          className="text-[13px] leading-relaxed text-[#093E06]"
        />
      ) : null}
    </>
  );
}
