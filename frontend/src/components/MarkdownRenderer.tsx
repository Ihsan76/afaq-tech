"use client";

import { useMemo } from "react";

const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`]+)`/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const ITALIC_RE = /\*([^*]+)\*/g;
const HEADING_RE = /^(#{1,3})\s(.+)$/gm;
const UNORDERED_LIST_RE = /^[-*]\s(.+)$/gm;
const ORDERED_LIST_RE = /^\d+\.\s(.+)$/gm;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const PARAGRAPH_RE = /\n\n+/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = escapeHtml(text);
  let key = 0;

  const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded text-sm" style={{ backgroundColor: "var(--color-muted)", color: "var(--color-primary)" }}>
          {match[1].slice(1, -1)}
        </code>
      );
    } else if (match[2]) {
      parts.push(<strong key={key++}>{match[2].slice(2, -2)}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3].slice(1, -1)}</em>);
    } else if (match[4]) {
      parts.push(
        <a key={key++} href={match[6]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
          {match[5]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts;
}

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const rendered = useMemo(() => {
    const elements: React.ReactNode[] = [];
    let key = 0;
    let lastIndex = 0;
    let codeMatch: RegExpExecArray | null;

    const codeBlocks: { index: number; lang: string; code: string; length: number }[] = [];
    const codeRegex = new RegExp(CODE_BLOCK_RE.source, "g");
    while ((codeMatch = codeRegex.exec(content)) !== null) {
      codeBlocks.push({
        index: codeMatch.index,
        lang: codeMatch[1],
        code: codeMatch[2],
        length: codeMatch[0].length,
      });
    }

    let textStart = 0;
    for (const block of codeBlocks) {
      if (block.index > textStart) {
        const textPart = content.slice(textStart, block.index);
        const textElements = renderTextContent(textPart, key);
        elements.push(...textElements);
        key += 1000;
      }

      elements.push(
        <pre key={key++} className="rounded-xl overflow-x-auto my-3 p-4 text-sm" style={{ backgroundColor: "var(--color-muted)", border: "1px solid var(--color-border)", direction: "ltr" }}>
          <code>{escapeHtml(block.code)}</code>
        </pre>
      );

      textStart = block.index + block.length;
    }

    if (textStart < content.length) {
      const textPart = content.slice(textStart);
      const textElements = renderTextContent(textPart, key);
      elements.push(...textElements);
    }

    return elements;
  }, [content]);

  return <div className="space-y-2 leading-relaxed">{rendered}</div>;
}

function renderTextContent(text: string, keyOffset: number): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let key = keyOffset;

  const lines = text.split("\n");
  let inList: "ul" | null = null;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 pr-4">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const headingMatch = line.match(/^(#{1,3})\s(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      elements.push(
        <Tag key={key++} className="font-bold" style={{ marginTop: level === 1 ? "1rem" : "0.5rem", color: "var(--color-text)" }}>
          {renderInline(headingMatch[2])}
        </Tag>
      );
      continue;
    }

    const ulMatch = line.match(/^[-*]\s(.+)$/);
    if (ulMatch) {
      inList = "ul";
      listItems.push(<li key={`li-${key++}`}>{renderInline(ulMatch[1])}</li>);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s(.+)$/);
    if (olMatch) {
      flushList();
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 pr-4" start={1}>
          <li>{renderInline(olMatch[1])}</li>
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      flushList();
      continue;
    }

    flushList();
    elements.push(
      <p key={key++} style={{ color: "var(--color-text)" }}>
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}
