// Reads YouTube, YouTube Music and playlist links into what the embed player needs.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;

export class LinkError extends Error {}

/**
 * @returns {{kind:'video'|'playlist', videoId:string|null, listId:string|null, source:'YouTube'|'YouTube Music', url:string}}
 * @throws {LinkError} with a sentence the visitor can act on
 */
export function parseLink(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new LinkError('Paste a link first.');
  // A bare 11-character ID works too.
  if (VIDEO_ID.test(text)) return { kind: 'video', videoId: text, listId: null, source: 'YouTube', url: `https://www.youtube.com/watch?v=${text}` };

  if (/\s/.test(text) || !text.includes('.')) throw new LinkError('That is not a link. Copy it from the address bar or the Share button.');
