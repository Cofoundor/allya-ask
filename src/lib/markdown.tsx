/* The model answers in light markdown. Render it as React nodes rather than
   HTML — nothing this file produces can inject markup, so there is no
   innerHTML sink anywhere in the app. */

import { Fragment, type ReactNode } from 'react';

/** **bold**, *italic*, `code`, and bare links */
const INLINE = /(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`\n]+`)|(https?:\/\/[^\s<>()]+)/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${m.index}`;
    const [, bold, em, code, link] = m;
    if (bold) out.push(<strong key={key}>{bold.slice(2, -2)}</strong>);
    else if (em) out.push(<em key={key}>{em.slice(1, -1)}</em>);
    else if (code) out.push(<code key={key}>{code.slice(1, -1)}</code>);
    else if (link) {
      // a sentence-final period is punctuation, not part of the URL
      const trimmed = link.replace(/[.,;:!?]+$/, '');
      out.push(
        <a key={key} href={trimmed} target="_blank" rel="noopener noreferrer">
          {trimmed}
        </a>,
      );
      if (trimmed.length < link.length) out.push(link.slice(trimmed.length));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function lines(chunk: string[], keyBase: string): ReactNode[] {
  return chunk.flatMap((line, i) =>
    i === 0 ? inline(line, `${keyBase}-${i}`) : [<br key={`${keyBase}-br-${i}`} />, ...inline(line, `${keyBase}-${i}`)],
  );
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

/** Blocks: bullet runs, numbered runs, and everything else as paragraphs. */
export function RichText({ text }: { text: string }) {
  const raw = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < raw.length) {
    const line = raw[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (BULLET.test(line)) {
      const items: string[] = [];
      while (i < raw.length && BULLET.test(raw[i])) items.push(raw[i++].replace(BULLET, ''));
      blocks.push(
        <ul key={`ul-${i}`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `ul-${i}-${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (NUMBER.test(line)) {
      const items: string[] = [];
      while (i < raw.length && NUMBER.test(raw[i])) items.push(raw[i++].replace(NUMBER, ''));
      blocks.push(
        <ol key={`ol-${i}`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `ol-${i}-${j}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const para: string[] = [];
    while (i < raw.length && raw[i].trim() && !BULLET.test(raw[i]) && !NUMBER.test(raw[i])) para.push(raw[i++]);
    blocks.push(<p key={`p-${i}`}>{lines(para, `p-${i}`)}</p>);
  }

  return <Fragment>{blocks}</Fragment>;
}
