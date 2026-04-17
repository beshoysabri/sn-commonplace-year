import type { ReactNode } from 'react';

// /g for split (captures URLs as alternating array entries).
const URL_SPLIT = /(https?:\/\/[^\s<>"]+)/g;
// Non-global form for safe repeated .test() without lastIndex drift.
const URL_TEST = /^https?:\/\/[^\s<>"]+$/;

export function Linkify({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(URL_SPLIT);
  const nodes: ReactNode[] = parts.map((part, i) =>
    URL_TEST.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
  return <>{nodes}</>;
}
