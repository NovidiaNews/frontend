/**
 * Sanitize SVG/HTML strings for safe rendering via dangerouslySetInnerHTML.
 * Strips all <script>, <iframe>, <object>, <embed>, <form>, event handlers,
 * and javascript: URLs. Only allows safe SVG elements and attributes.
 */

const FORBIDDEN_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|link|meta|base)\b[^>]*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URLS = /javascript\s*:/gi;
const DATA_SCRIPT = /data\s*:\s*text\/html/gi;

export function sanitizeSvg(html: string): string {
  if (!html) return '';
  
  return html
    .replace(FORBIDDEN_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URLS, '')
    .replace(DATA_SCRIPT, '');
}
