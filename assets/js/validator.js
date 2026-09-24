/**
 * Playable Pasts — classroom-readiness validator.
 *
 * One module, two homes: the browser (assets/js/check-ui.js) and CI
 * (tools/validate.mjs). Plain ESM, no dependencies, no build step.
 *
 * It checks a single self-contained HTML game against the Playable Past
 * hard rules: https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276
 *
 * Honesty rule (Playable Past hard rule 10): this file NEVER reports a check
 * as passed unless it actually ran it. Anything a static read cannot establish
 * is returned as a `manual` item for a human to test, not as a pass.
 */

export const SEVERITY = {
  BLOCKING: 'blocking',
  WARNING: 'warning',
  MANUAL: 'manual',
};

const MB = 1024 * 1024;
export const SIZE_WARN = 3 * MB;
export const SIZE_BLOCK = 10 * MB;

/* ------------------------------------------------------------------ *
 * Small text helpers
 * ------------------------------------------------------------------ */

/** Byte offset -> 1-based line number, using a prebuilt offset table. */
function lineIndex(source) {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') starts.push(i + 1);
  }
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

function snippet(source, offset, length = 90) {
  const start = Math.max(0, offset - 12);
  return source
    .slice(start, start + length)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip comments and string-ish noise that produce false positives when we
 * look for real code. Keeps offsets stable by replacing with spaces.
 */
function blankOut(source, pattern) {
  return source.replace(pattern, (m) => ' '.repeat(m.length));
}

/**
 * Block comments only. Safe to run over the whole document, because a CSS
 * `url(//host/path)` must survive: protocol-relative URLs are real remote
 * fetches, not comments.
 */
function stripComments(source) {
  let out = blankOut(source, /<!--[\s\S]*?-->/g);
  out = blankOut(out, /\/\*[\s\S]*?\*\//g);
  return out;
}

/** Replace every character except newlines with a space, so offsets and lines survive. */
function blankText(text) {
  return text.replace(/[^\n]/g, ' ');
}

/**
 * Blank out HTML comments, but only in markup. Inside <script> and <style>
 * a `<!--` is not an HTML comment, and treating it as one could swallow real
 * code up to the next `-->`. Offsets are preserved.
 */
function blankHtmlComments(source) {
  const open = /<!--|<(script|style)\b[^>]*>/gi;
  let out = '';
  let pos = 0;
  let m;
  while ((m = open.exec(source))) {
    if (m[0] === '<!--') {
      const end = source.indexOf('-->', m.index + 4);
      const stop = end < 0 ? source.length : end + 3;
      out += source.slice(pos, m.index) + blankText(source.slice(m.index, stop));
      pos = stop;
      open.lastIndex = stop;
    } else {
      const close = new RegExp(`</${m[1]}\\s*>`, 'gi');
      close.lastIndex = open.lastIndex;
      const c = close.exec(source);
      open.lastIndex = c ? c.index + c[0].length : source.length;
    }
  }
  return out + source.slice(pos);
}

/**
 * CSS comments only. `//` is not a comment in CSS — it starts a
 * protocol-relative URL, which is a real remote fetch — so CSS and JS need
 * separate strippers.
 */
function stripCssComments(css) {
  return blankOut(css, /\/\*[\s\S]*?\*\//g);
}

const REGEX_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete',
  'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

/**
 * A small JavaScript scanner. It walks the code once, tracking strings,
 * template literals (including `${...}` expressions), line and block
 * comments, and regex literals (by the usual "what came before the slash"
 * guess). Regular expressions over raw code cannot do this: `"a//b"` is not a
 * comment and `"src/*.js"` does not open one.
 *
 * Returns three versions of the code, all the same length as the input so
 * offsets stay valid:
 *   noComments  — comments blanked, strings intact (for reading URLs)
 *   codeOnly    — comments, string contents, and regex bodies blanked
 *                 (for behaviour: game text saying "fetch (and pay for) grain"
 *                 is not a network call)
 *   stringsOnly — everything except string contents blanked
 */
function scanJs(code) {
  const n = code.length;
  const ranges = []; // [start, end, kind] in order, non-overlapping
  const stack = []; // 'brace' | 'tpl'
  let last = -1; // index of the last significant character
  let i = 0;

  const regexAllowed = () => {
    if (last < 0) return true;
    const ch = code[last];
    if (/[)\]}"'`]/.test(ch)) return false;
    if (/[\w$]/.test(ch)) {
      let s = last;
      while (s > 0 && /[\w$]/.test(code[s - 1])) s--;
      return REGEX_KEYWORDS.has(code.slice(s, last + 1));
    }
    return true;
  };

  // Called with i just past a backtick, or just past the `}` closing `${`.
  const readTemplate = () => {
    const start = i;
    while (i < n) {
      const ch = code[i];
      if (ch === '\\') { i += 2; continue; }
      if (ch === '`') {
        ranges.push([start, i, 'string']);
        last = i;
        i++;
        return;
      }
      if (ch === '$' && code[i + 1] === '{') {
        ranges.push([start, i, 'string']);
        i += 2;
        last = i - 1;
        stack.push('tpl');
        return;
      }
      i++;
    }
    ranges.push([start, n, 'string']);
  };

  while (i < n) {
    const c = code[i];
    const d = code[i + 1];
    if (c === '/' && d === '/') {
      const e = code.indexOf('\n', i);
      const end = e < 0 ? n : e;
      ranges.push([i, end, 'comment']);
      i = end;
      continue;
    }
    if (c === '/' && d === '*') {
      const e = code.indexOf('*/', i + 2);
      const end = e < 0 ? n : e + 2;
      ranges.push([i, end, 'comment']);
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== c && code[j] !== '\n') j += code[j] === '\\' ? 2 : 1;
      j = Math.min(j, n);
      ranges.push([i + 1, j, 'string']);
      last = j;
      i = j + 1;
      continue;
    }
    if (c === '`') {
      i++;
      readTemplate();
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      while (j < n && code[j] !== '\n') {
        const ch = code[j];
        if (ch === '\\') { j += 2; continue; }
        if (ch === '[') inClass = true;
        else if (ch === ']') inClass = false;
        else if (ch === '/' && !inClass) break;
        j++;
      }
      if (j < n && code[j] === '/') {
        ranges.push([i + 1, j, 'regex']);
        j++;
        while (j < n && /[a-z]/i.test(code[j])) j++;
        last = j - 1;
        i = j;
        continue;
      }
      // No closing slash on the line: it was division after all.
    }
    if (c === '{') {
      stack.push('brace');
    } else if (c === '}' && stack.pop() === 'tpl') {
      i++;
      readTemplate();
      continue;
    }
    if (!/\s/.test(c)) last = i;
    i++;
  }

  const assemble = (keep) => {
    let out = '';
    let pos = 0;
    for (const [s, e, kind] of ranges) {
      if (s > pos) {
        const gap = code.slice(pos, s);
        out += keep.has('code') ? gap : blankText(gap);
      }
      const piece = code.slice(s, e);
      out += keep.has(kind) ? piece : blankText(piece);
      pos = Math.max(pos, e);
    }
    if (pos < n) out += keep.has('code') ? code.slice(pos) : blankText(code.slice(pos));
    return out;
  };

  return {
    noComments: assemble(new Set(['code', 'string', 'regex'])),
    codeOnly: assemble(new Set(['code'])),
    stringsOnly: assemble(new Set(['string'])),
  };
}

/**
 * The contents of the string literal that opens at `quoteAt` in `text`
 * (a template literal is read up to its first `${`).
 */
function readLiteral(text, quoteAt) {
  const q = text[quoteAt];
  let j = quoteAt + 1;
  while (j < text.length && text[j] !== q && text[j] !== '\n') {
    if (q === '`' && text[j] === '$' && text[j + 1] === '{') break;
    j += text[j] === '\\' ? 2 : 1;
  }
  return text.slice(quoteAt + 1, j);
}

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', sol: '/', bsol: '\\',
  period: '.', tab: '\t', newline: '\n', nbsp: ' ', lpar: '(', rpar: ')',
  num: '#', percnt: '%', quest: '?', equals: '=',
};

/**
 * Decode character references in an attribute value, the way the browser
 * does before it fetches anything: `src="https&#58;//cdn/x.js"` is a remote
 * script.
 */
function decodeEntities(value) {
  if (!value.includes('&')) return value;
  return value.replace(/&(?:#(\d+);?|#x([0-9a-f]+);?|([a-z]+);)/gi, (m, dec, hex, name) => {
    if (dec || hex) {
      const cp = dec ? parseInt(dec, 10) : parseInt(hex, 16);
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '�';
    }
    const k = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, k) ? NAMED_ENTITIES[k] : m;
  });
}

/**
 * Normalise a URL the way the browser's URL parser does: it ignores tabs
 * and newlines anywhere, and leading or trailing spaces.
 */
function normaliseUrl(url) {
  return String(url).replace(/[\t\n\r]/g, '').trim();
}

/** Is this URL fetched from somewhere other than the file itself? */
function isRemote(url) {
  const u = normaliseUrl(url);
  return /^[/\\]{2}/.test(u) || /^(?:https?|ftp|wss?):/i.test(u);
}

/** Inline data that costs nothing at play time. */
function isInline(url) {
  return /^(data:|blob:|#|javascript:|about:)/i.test(normaliseUrl(url));
}

/**
 * A reference to another file that sits next to the HTML file (or on the
 * author's own disk). Values that are clearly built by code at run time
 * (`${...}`, `{{...}}`) are skipped: we cannot know what they become.
 */
function isLocalFile(url) {
  const u = normaliseUrl(url);
  if (!u || isRemote(u) || isInline(u)) return false;
  if (/\$\{|\{\{|^["'+]/.test(u)) return false;
  return true;
}

/* ------------------------------------------------------------------ *
 * Tag scanning
 * ------------------------------------------------------------------ */

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(raw))) {
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    const key = m[1].toLowerCase();
    // As in the browser, the first occurrence of a repeated attribute wins.
    if (!(key in attrs)) attrs[key] = decodeEntities(value);
  }
  return attrs;
}

/** Offset ranges of every <script> and <style> body. */
function rawTextRanges(source) {
  const ranges = [];
  const re = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
  let m;
  while ((m = re.exec(source))) {
    const start = m.index + m[0].indexOf('>') + 1;
    ranges.push([start, start + m[2].length]);
  }
  return ranges;
}

/**
 * Every tag in the document, with attributes and byte offset. Run it on the
 * source with HTML comments blanked, so a commented-out <script src> is not
 * reported. Tags found inside a <script> or <style> body (HTML built by code)
 * are marked `embedded`.
 */
function scanTags(source) {
  const raw = rawTextRanges(source);
  const tags = [];
  let r = 0;
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(source))) {
    while (r < raw.length && raw[r][1] <= m.index) r++;
    tags.push({
      name: m[1].toLowerCase(),
      attrs: parseAttrs(m[2] || ''),
      offset: m.index,
      raw: m[0],
      embedded: r < raw.length && raw[r][0] <= m.index,
    });
  }
  return tags;
}

/** Text content with all tags removed — what a player can actually read. */
function visibleText(source) {
  return decodeEntities(source
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Text the player can actually read, including the content data block.
 *
 * The build standard tells authors to keep the game's text in a JSON or JS
 * object near the top of the file, so a game can be almost entirely made of
 * string literals inside <script>. Any check about wording has to look there
 * too, or it punishes authors for following the rule.
 */
function readableText(source) {
  const strings = [];
  for (const { code } of scriptBodies(source)) {
    const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
    let m;
    while ((m = re.exec(code))) {
      const value = m[1] ?? m[2] ?? m[3] ?? '';
      if (value.length > 1) strings.push(value);
    }
  }
  // Each string literal stays on its own line, so a check that needs two
  // words "in the same label" does not join the end of one string to the
  // start of the next.
  return [visibleText(source), ...strings.map((s) => s.replace(/\s+/g, ' '))].join('\n');
}

/** Contents of every <script> block, for code-only checks. */
function scriptBodies(source) {
  const bodies = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(source))) {
    const attrs = parseAttrs(m[1] || '');
    if (attrs.src) continue; // external, handled elsewhere
    const type = (attrs.type || '').trim().toLowerCase();
    // Only these types run. A JSON data block or a text/template is inert.
    const isJs = !type || type === 'module' || /(?:java|ecma)script|jscript|livescript|babel/.test(type);
    let scanned = null;
    bodies.push({
      code: m[2],
      offset: m.index + m[0].indexOf('>') + 1,
      isJs,
      // Scanned lazily, inside the checks, so a scanner failure is reported
      // as a checker error rather than crashing the whole report.
      get js() {
        if (!scanned) scanned = scanJs(this.code);
        return scanned;
      },
    });
  }
  return bodies;
}

/* ------------------------------------------------------------------ *
 * Findings
 * ------------------------------------------------------------------ */

function finding(id, severity, title, plain, fix, evidence = []) {
  return { id, severity, title, plain, fix, evidence };
}

/* ------------------------------------------------------------------ *
 * The checks
 * ------------------------------------------------------------------ */

/**
 * Rule 1 & the strong default: one file, everything inlined, nothing fetched.
 * These are blocking because the game will visibly fail in a classroom with
 * the wifi off or a filtered school network.
 */
const ASSET_TAGS = {
  img: ['src', 'srcset'],
  image: ['href', 'xlink:href'],
  audio: ['src'],
  video: ['src', 'poster'],
  source: ['src', 'srcset'],
  track: ['src'],
  iframe: ['src'],
  embed: ['src'],
  object: ['data'],
  input: ['src'],
  use: ['href', 'xlink:href'],
  body: ['background'],
  table: ['background'],
  td: ['background'],
  th: ['background'],
};

function srcsetUrls(value) {
  return value.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
}

function evidenceAt(ctx, offset, text) {
  return { line: ctx.lineAt(offset), text, snippet: snippet(ctx.source, offset) };
}

function checkSelfContained(ctx) {
  const { tags } = ctx;
  const out = [];

  const externalScripts = [];
  const externalStyles = [];
  const externalAssets = [];
  const externalPreloads = [];
  const localFiles = [];
  const navigation = [];

  // A local file is only reported for tags written in the page itself. Tags
  // inside a <script> body are HTML built by code, and their values are
  // usually assembled at run time.
  const visit = (tag, offset, via, depth) => {
    const a = tag.attrs;
    const inside = via ? ` inside ${via}` : '';
    const local = (url, what) => {
      if (!tag.embedded && isLocalFile(url)) localFiles.push({ offset, url, what: what + inside });
    };

    if (tag.name === 'script') {
      if (a.src && isRemote(a.src)) externalScripts.push({ offset, url: a.src });
      else if (a.src) local(a.src, '<script src>');
      return;
    }

    if (tag.name === 'link') {
      const rel = (a.rel || '').toLowerCase();
      const href = a.href || '';
      if (!href || isInline(href)) return;
      if (isRemote(href)) {
        if (/stylesheet/.test(rel)) externalStyles.push({ offset, url: href });
        else if (/preload|prefetch|modulepreload|preconnect|dns-prefetch/.test(rel)) {
          externalPreloads.push({ offset, url: href });
        } else if (/icon|manifest/.test(rel)) {
          externalAssets.push({ offset, url: href, what: `link rel="${rel}"${inside}` });
        }
      } else if (/stylesheet/.test(rel)) {
        // A missing favicon or preload breaks nothing a student sees; a
        // missing stylesheet does.
        local(href, `<link rel="${rel}">`);
      }
      return;
    }

    if (tag.name === 'base') {
      if (a.href && isRemote(a.href)) navigation.push({ offset, url: a.href, what: `<base href>${inside}` });
      return;
    }

    if (tag.name === 'meta') {
      if ((a['http-equiv'] || '').trim().toLowerCase() !== 'refresh') return;
      const m = /url\s*=\s*['"]?\s*([^'";\s]+)/i.exec(a.content || '');
      if (!m) return;
      if (isRemote(m[1])) navigation.push({ offset, url: m[1], what: `<meta http-equiv="refresh">${inside}` });
      else local(m[1], '<meta http-equiv="refresh">');
      return;
    }

    if (tag.name === 'iframe' && a.srcdoc && depth < 3) {
      // srcdoc is a whole page written into an attribute; what it loads, the game loads.
      for (const inner of scanTags(blankHtmlComments(a.srcdoc))) {
        visit({ ...inner, embedded: tag.embedded || inner.embedded }, offset, 'an iframe srcdoc', depth + 1);
      }
    }

    const attrNames = ASSET_TAGS[tag.name];
    if (!attrNames) return;
    for (const name of attrNames) {
      const value = a[name];
      if (!value || isInline(value)) continue;
      const urls = name === 'srcset' ? srcsetUrls(value) : [value];
      for (const url of urls) {
        if (isRemote(url)) externalAssets.push({ offset, url, what: `<${tag.name} ${name}>${inside}` });
        else local(url, `<${tag.name} ${name}>`);
      }
    }
  };

  for (const tag of tags) visit(tag, tag.offset, '', 0);

  if (externalScripts.length) {
    out.push(finding(
      'external-script',
      SEVERITY.BLOCKING,
      'The game loads JavaScript from the internet',
      'Your game pulls code from another website while it runs. On a classroom '
        + 'network that blocks it — or with the wifi off — the game will not start at all.',
      'Ask your agent: "Inline every external script directly into the HTML file so '
        + 'the game has no <script src> pointing at a website."',
      externalScripts.map(({ offset, url }) => evidenceAt(ctx, offset, url)),
    ));
  }

  if (externalStyles.length) {
    out.push(finding(
      'external-stylesheet',
      SEVERITY.BLOCKING,
      'The game loads a stylesheet from the internet',
      'The styling lives on another website. Offline, the game still runs but '
        + 'looks broken — usually unreadable on a projector.',
      'Ask your agent: "Move all CSS into a <style> block inside the file and remove '
        + 'every <link rel=stylesheet> that points at a website."',
      externalStyles.map(({ offset, url }) => evidenceAt(ctx, offset, url)),
    ));
  }

  if (externalAssets.length) {
    out.push(finding(
      'external-asset',
      SEVERITY.BLOCKING,
      'Images or media are loaded from the internet',
      'Pictures, audio, or video are hosted elsewhere. Offline they show as broken '
        + 'placeholders, and the source may vanish or change without warning.',
      'Ask your agent: "Replace remote images with inline SVG, emoji, or small data: '
        + 'URIs so nothing is fetched during play."',
      externalAssets.map(({ offset, url, what }) => evidenceAt(ctx, offset, `${what} → ${url}`)),
    ));
  }

  if (localFiles.length) {
    out.push(finding(
      'local-file',
      SEVERITY.BLOCKING,
      'The game needs other files sitting next to it',
      'The page loads a script, stylesheet, picture, or sound from a separate file instead '
        + 'of carrying it inside. It may work on the computer where it was made, but when '
        + 'you send students the HTML file, or upload it to your LMS, that other file is '
        + 'not there: the game may not start, may look unstyled, or may show broken pictures.',
      'Ask your agent: "Put everything the game needs inside the one HTML file: paste '
        + 'scripts into <script> blocks and CSS into a <style> block, and turn pictures and '
        + 'sounds into inline SVG or data: URIs. Nothing should load from a separate file."',
      localFiles.map(({ offset, url, what }) => evidenceAt(ctx, offset, `${what} → ${url}`)),
    ));
  }

  if (navigation.length) {
    out.push(finding(
      'remote-navigation',
      SEVERITY.BLOCKING,
      'The page sends the browser to another website',
      'As it opens, the file either redirects to another website or tells the browser to '
        + 'look up its links and pictures on one. With the wifi off, or on a school network '
        + 'that blocks that site, the game goes blank or its pictures and links break.',
      'Ask your agent: "Remove any <meta http-equiv=refresh> redirect and any <base href> '
        + 'that points at a website, so the game runs from this file alone."',
      navigation.map(({ offset, url, what }) => evidenceAt(ctx, offset, `${what} → ${url}`)),
    ));
  }

  if (externalPreloads.length) {
    out.push(finding(
      'external-preload',
      SEVERITY.WARNING,
      'The file asks the browser to contact another website',
      'A preload or preconnect hint reaches out to a server as the page opens. It '
        + 'will not break play, but it means the file is not truly self-contained.',
      'Ask your agent: "Remove all preload, prefetch, preconnect, and dns-prefetch links."',
      externalPreloads.map(({ offset, url }) => evidenceAt(ctx, offset, url)),
    ));
  }

  return out;
}

/**
 * Where CSS can live: <style> bodies, style="" attributes, and strings in
 * scripts (style text set from code). Visible prose is not CSS — a sources
 * screen that quotes "url(https://archive.org/...)" fetches nothing.
 * Computed once per report.
 */
function cssRegions(ctx) {
  if (ctx.cssRegionsCache) return ctx.cssRegionsCache;
  const regions = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let m;
  while ((m = re.exec(ctx.markup))) {
    regions.push({ kind: 'style', text: stripCssComments(m[1]), offset: m.index + m[0].indexOf('>') + 1 });
  }
  for (const tag of ctx.tags) {
    if (tag.attrs.style) regions.push({ kind: 'attr', text: tag.attrs.style, offset: tag.offset, fixed: true });
  }
  for (const s of ctx.scripts) {
    if (s.isJs) regions.push({ kind: 'string', text: s.js.stringsOnly, offset: s.offset });
  }
  ctx.cssRegionsCache = regions;
  return regions;
}

const CSS_REMOTE = [
  [/@import\s+(?:url\(\s*)?["']?\s*((?:https?:)?\/\/[^"')\s]+)/gi, '@import'],
  [/url\(\s*["']?\s*((?:https?:)?\/\/[^"')\s]+)/gi, 'url()'],
];

/** Quoted remote candidates in every image-set(...) — which needs no url(). */
function imageSetUrls(text) {
  const found = [];
  const re = /(?:-webkit-)?image-set\(/gi;
  let m;
  while ((m = re.exec(text))) {
    let depth = 1;
    let j = re.lastIndex;
    while (j < text.length && depth > 0 && j - re.lastIndex < 4000) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') depth--;
      j++;
    }
    const inner = text.slice(re.lastIndex, j);
    const q = /["']\s*((?:https?:)?\/\/[^"']+)["']/g;
    let u;
    while ((u = q.exec(inner))) found.push({ index: m.index, url: u[1] });
  }
  return found;
}

function checkRemoteCss(ctx) {
  const out = [];
  const hits = [];

  for (const region of cssRegions(ctx)) {
    const at = (i) => (region.fixed ? region.offset : region.offset + i);
    for (const [re, kind] of CSS_REMOTE) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(region.text))) hits.push({ offset: at(m.index), url: m[1], kind });
    }
    for (const { index, url } of imageSetUrls(region.text)) {
      hits.push({ offset: at(index), url, kind: 'image-set()' });
    }
  }

  // An `@import url(...)` matches both patterns above; keep one row per resource.
  const seen = new Set();
  const unique = hits.filter((h) => {
    const key = h.url.replace(/^https?:/i, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.offset - b.offset);

  if (unique.length) {
    const fonts = unique.filter((h) => /fonts\.(googleapis|gstatic)\.com|\.woff2?|\.ttf|\.otf/i.test(h.url));
    out.push(finding(
      'remote-css-resource',
      SEVERITY.BLOCKING,
      fonts.length ? 'The game downloads a font from the internet' : 'CSS fetches a file from the internet',
      fonts.length
        ? 'Your stylesheet downloads a web font. With the wifi off the text falls back '
          + 'to a default font, which usually wrecks the layout — and on a school network '
          + 'that blocks Google Fonts it fails every time.'
        : 'A stylesheet rule loads something from another website while the game runs.',
      fonts.length
        ? 'Ask your agent: "Remove the web font and use a system font stack instead. For '
          + 'Chinese, Japanese, or Korean text use the system CJK stack, do not embed a font."'
        : 'Ask your agent: "Inline this resource as a data: URI or remove it."',
      unique.map((h) => evidenceAt(ctx, h.offset, `${h.kind} → ${h.url}`)),
    ));
  }

  return out;
}

/**
 * Rule 12 & the build standard: no network calls at play time, and no
 * dependency on an AI provider.
 *
 * These run on code with comments AND string contents blanked, so game text
 * such as "Send a servant to fetch (and pay for) grain" is not a call. The
 * call itself — `fetch(` — is outside the string, so it is still seen.
 */
const GLOBAL = '(?:(?:window|self|globalThis)\\s*\\.\\s*)?';
const NETWORK_APIS = [
  ['fetch', /\bfetch\s*\(/g, 'fetch()'],
  ['xhr', new RegExp(`\\bnew\\s+${GLOBAL}XMLHttpRequest\\b`, 'g'), 'XMLHttpRequest'],
  ['websocket', new RegExp(`\\bnew\\s+${GLOBAL}WebSocket\\b`, 'g'), 'WebSocket'],
  ['eventsource', new RegExp(`\\bnew\\s+${GLOBAL}EventSource\\b`, 'g'), 'EventSource'],
  ['beacon', /navigator\s*\.\s*sendBeacon\s*\(/g, 'navigator.sendBeacon()'],
  ['importscripts', /\bimportScripts\s*\(/g, 'importScripts()'],
];

/**
 * Calls that load whatever address they are given. Each pattern ends just
 * before the opening quote; the address is then read from the code with its
 * strings intact, and only a web address counts.
 */
const URL_LOADERS = [
  [/\bimport\s*\(\s*(?=["'`])/g, () => 'dynamic import() of a web address'],
  [/\bimport\s*(?=["'`])/g, () => 'import of a web address'],
  [/\b(?:import|export)\b[^;"'`()]*?\bfrom\s*(?=["'`])/g, () => 'import of a web address'],
  [new RegExp(`\\bnew\\s+${GLOBAL}(Image|Audio|Worker|SharedWorker)\\s*\\(\\s*(?=["'\`])`, 'g'),
    (m) => `new ${m[1]}() of a web address`],
  [/\.src\s*=\s*(?=["'`])/g, () => '.src set to a web address'],
];

function checkNoNetwork(ctx) {
  const { scripts } = ctx;
  const out = [];
  const hits = [];

  for (const script of scripts) {
    if (!script.isJs) continue;
    const { codeOnly, noComments } = script.js;
    for (const [, re, label] of NETWORK_APIS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(codeOnly))) hits.push({ offset: script.offset + m.index, label });
    }
    for (const [re, label] of URL_LOADERS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(codeOnly))) {
        const url = readLiteral(noComments, m.index + m[0].length);
        if (isRemote(url)) hits.push({ offset: script.offset + m.index, label: label(m) });
      }
    }
  }

  // `new Image().src = "..."` can match twice; one row per place in the file.
  const seen = new Set();
  const unique = hits
    .sort((a, b) => a.offset - b.offset)
    .filter((h) => (seen.has(h.offset) ? false : seen.add(h.offset)));

  if (unique.length) {
    out.push(finding(
      'network-during-play',
      SEVERITY.BLOCKING,
      'The game makes network requests while it is played',
      'The code calls out to a server during play. Playable Past requires no network '
        + 'traffic once the game is open, so it works from a USB stick, an LMS download, '
        + 'or a room with no wifi.',
      'Ask your agent: "Remove all network calls. Move whatever the game was fetching '
        + 'into the inline data block so it ships inside the file."',
      unique.map((h) => evidenceAt(ctx, h.offset, h.label)),
    ));
  }

  return out;
}

const AI_SIGNALS = [
  [/api\.openai\.com/gi, 'an OpenAI API endpoint'],
  [/api\.anthropic\.com/gi, 'an Anthropic API endpoint'],
  [/generativelanguage\.googleapis\.com/gi, 'a Google AI API endpoint'],
  [/api\.(?:mistral|cohere|groq|together)\.(?:ai|com)/gi, 'a model provider API endpoint'],
  [/window\s*\.\s*claude\b/g, 'a host-injected AI global (window.claude)'],
  [/\bopenai\s*\.\s*chat\b/gi, 'an OpenAI SDK call'],
  [/\banthropic\s*\.\s*messages\b/gi, 'an Anthropic SDK call'],
];

const KEY_SIGNALS = [
  [/\bsk-ant-[A-Za-z0-9_-]{16,}/g, 'an Anthropic API key'],
  [/\bsk-[A-Za-z0-9]{32,}/g, 'an OpenAI-style API key'],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, 'a Google API key'],
  [/\bghp_[A-Za-z0-9]{30,}/g, 'a GitHub token'],
];

function checkNoModelDependency(ctx) {
  const { clean, lineAt, source } = ctx;
  const out = [];

  const aiHits = [];
  for (const [re, label] of AI_SIGNALS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(clean))) aiHits.push({ offset: m.index, label });
  }
  if (aiHits.length) {
    out.push(finding(
      'model-dependency',
      SEVERITY.BLOCKING,
      'The game needs an AI model to run',
      'The game calls a language model while students play. That means it stops working '
        + 'the moment the account, the key, or the funding ends — and every student needs '
        + 'network access. Playable Past games must run on their own.',
      'Ask your agent: "Replace the live model calls with authored content and explicit '
        + 'game rules written into the file, so the game runs with no AI account."',
      aiHits.map((h) => ({
        line: lineAt(h.offset),
        text: h.label,
        snippet: snippet(source, h.offset),
      })),
    ));
  }

  const keyHits = [];
  for (const [re, label] of KEY_SIGNALS) {
    re.lastIndex = 0;
    let m;
    // The raw source, not `clean`: a key inside a comment is just as readable.
    while ((m = re.exec(source))) keyHits.push({ offset: m.index, label });
  }
  if (keyHits.length) {
    out.push(finding(
      'exposed-secret',
      SEVERITY.BLOCKING,
      'A secret key appears to be written into the file',
      'What looks like an API key is sitting in the file. Anyone who opens the game can '
        + 'read it and spend money on your account. Treat the key as compromised.',
      'Revoke that key now at the provider, then ask your agent: "Remove the key and the '
        + 'feature that used it; the game must not call any paid service."',
      keyHits.map((h) => ({
        line: lineAt(h.offset),
        // Never echo the secret itself back into a report.
        text: `${h.label} (value withheld)`,
        snippet: '',
      })),
    ));
  }

  return out;
}

/** Rule 4 & the build standard: the "Sources & assumptions" screen is required. */
function checkProvenance(ctx) {
  const { text } = ctx;
  const out = [];

  // The build standard calls the screen "Sources & assumptions", but a game
  // that names it "Sources & limitations" or "Provenance & limitations" has
  // the same screen. Firing on a correct game teaches instructors to ignore
  // the checker, so the synonyms are accepted.
  //
  // The two words must sit together — in one heading, button label, or short
  // phrase — not merely somewhere in the file. "Source: my notes. Limitations
  // apply to shipping." is not a sources screen. So: within about 40
  // characters of each other, in either order, with no sentence break between.
  const SRC = '\\b(?:sources?|provenance)\\b';
  const LIM = '\\b(?:assumptions?|limitations?|caveats?)\\b';
  const hasScreen = new RegExp(`${SRC}[^.!?\\n]{0,40}?${LIM}|${LIM}[^.!?\\n]{0,40}?${SRC}`, 'i').test(text);

  if (!hasScreen) {
    out.push(finding(
      'no-sources-screen',
      SEVERITY.BLOCKING,
      'There is no "Sources & assumptions" screen',
      'Playable Past requires every game to show players where its content came from and '
        + 'what the game invented or assumed. This screen is not optional — without it '
        + 'students cannot tell evidence from interpretation.',
      'Ask your agent: "Add a Sources & assumptions screen listing the sources used and '
        + 'marking what is attested, what is interpretation, what is invented connective '
        + 'tissue, and what is counterfactual."',
      [],
    ));
  }

  // Any of the honest labels the workflow asks for, including the ones a
  // source-based game uses for its own layers (paraphrase, teaching model).
  const labelsInvented = /\b(invented|fictional|fictionali[sz]ed|imagined|reconstruct(?:ed|ion)|counterfactual|illustrative|assumption|paraphrases?d?|generated|teaching (?:model|prompts?|material)|interpretive|not (?:a )?(?:transcription|quotation))\b/i.test(text);
  if (hasScreen && !labelsInvented) {
    out.push(finding(
      'invented-content-unlabelled',
      SEVERITY.WARNING,
      'Nothing in the game is labelled as invented or assumed',
      'The game names its sources but never marks anything as invented, assumed, or '
        + 'contested. Almost every historical game needs some connective tissue, and '
        + 'students should be able to see which parts those are.',
      'Ask your agent: "In the Sources & assumptions screen, label the invented dialogue, '
        + 'modelling assumptions, and any contested interpretations explicitly."',
      [],
    ));
  }

  return out;
}

/** Build standard: accessibility. Static checks only — see the manual list. */
function checkAccessibility(ctx) {
  const { tags, source, lineAt, clean, text } = ctx;
  const out = [];

  const html = tags.find((t) => t.name === 'html');
  if (!html || !html.attrs.lang) {
    out.push(finding(
      'missing-lang',
      SEVERITY.WARNING,
      'The page does not say what language it is in',
      'Screen readers use the language attribute to pick a voice. Without it, a Chinese '
        + 'or Arabic game may be read aloud with English pronunciation.',
      'Ask your agent: "Set the lang attribute on the <html> tag to the classroom language, '
        + 'for example lang=\\"zh-Hant\\" or lang=\\"en\\"."',
      [],
    ));
  }

  // Browsers accept "utf8" as well as "utf-8", and a byte-order mark at the
  // very start of the file settles the encoding with no <meta> at all.
  // (Callers must keep the mark when decoding; check-ui.js does.)
  const hasCharset = source.charCodeAt(0) === 0xfeff || tags.some(
    (t) => t.name === 'meta'
      && (/^\s*utf-?8\s*$/i.test(t.attrs.charset || '')
        || /charset\s*=\s*["']?\s*utf-?8\b/i.test(t.attrs.content || '')),
  );
  const nonAscii = /[^\x00-\x7F]/.test(source);
  if (!hasCharset) {
    out.push(finding(
      'missing-charset',
      nonAscii ? SEVERITY.BLOCKING : SEVERITY.WARNING,
      'The file does not declare UTF-8',
      nonAscii
        ? 'The game contains non-English characters but never declares its encoding. Opened '
          + 'from a local file, accents or CJK characters will very likely appear as garbage.'
        : 'The file does not declare its text encoding. Add it before the game gains any '
          + 'non-English text.',
      'Ask your agent: "Add <meta charset=\\"utf-8\\"> as the first thing in the <head>."',
      [],
    ));
  }

  const viewport = tags.some((t) => t.name === 'meta' && (t.attrs.name || '').toLowerCase() === 'viewport');
  if (!viewport) {
    out.push(finding(
      'missing-viewport',
      SEVERITY.WARNING,
      'No mobile viewport is set',
      'Students turn up with phones even when laptops are the plan. Without a viewport tag '
        + 'the game renders at desktop width and needs pinch-zooming.',
      'Ask your agent: "Add <meta name=\\"viewport\\" content=\\"width=device-width, '
        + 'initial-scale=1\\"> and check the layout at phone width."',
      [],
    ));
  }

  const clickable = tags.filter(
    (t) => ['div', 'span', 'li', 'td', 'p', 'img'].includes(t.name)
      && (t.attrs.onclick !== undefined)
      && t.attrs.role !== 'button'
      && t.attrs.tabindex === undefined,
  );
  if (clickable.length) {
    out.push(finding(
      'clickable-non-button',
      SEVERITY.WARNING,
      'Some controls cannot be reached by keyboard',
      clickable.length === 1
        ? 'One clickable element is a plain container rather than a button. A student who '
          + 'cannot use a mouse, or who uses a screen reader, cannot press it at all.'
        : `${clickable.length} clickable elements are plain containers rather than buttons. `
          + 'A student who cannot use a mouse, or who uses a screen reader, cannot press '
          + 'them at all.',
      'Ask your agent: "Replace clickable <div> and <span> elements with real <button> '
        + 'elements so they work with Tab and Enter."',
      clickable.slice(0, 8).map((t) => ({
        line: lineAt(t.offset),
        text: `<${t.name} onclick>`,
        snippet: snippet(source, t.offset),
      })),
    ));
  }

  const imgsNoAlt = tags.filter(
    (t) => t.name === 'img' && t.attrs.alt === undefined && t.attrs.role !== 'presentation',
  );
  if (imgsNoAlt.length) {
    out.push(finding(
      'img-missing-alt',
      SEVERITY.WARNING,
      'Images have no text alternative',
      'An image carrying meaning — a map, a document scan, a portrait — needs a text '
        + 'description. Purely decorative images should say so with alt="".',
      'Ask your agent: "Give every <img> an alt attribute; use alt=\\"\\" for decoration."',
      imgsNoAlt.slice(0, 8).map((t) => ({
        line: lineAt(t.offset),
        text: '<img> without alt',
        snippet: snippet(source, t.offset),
      })),
    ));
  }

  // `transition: none` switches animation off; it is not animation. Prose is
  // not CSS, so only style blocks, style attributes, and (more strictly,
  // needing a duration) style text in script strings are read.
  const ANIM_CSS = /@keyframes|\b(?:animation|transition)\s*:\s*(?!(?:none|initial|unset|inherit)\s*(?:!important\s*)?[;}"']|(?:none|initial|unset|inherit)\s*$)[^;}\s]/im;
  const ANIM_STRING = /@keyframes\s+[\w-]+\s*\{|\b(?:animation|transition)\s*:[^;}"'`\n]*\d(?:\.\d+)?m?s\b/i;
  const animates = cssRegions(ctx).some((r) => (r.kind === 'string' ? ANIM_STRING : ANIM_CSS).test(r.text));
  const respectsMotion = /prefers-reduced-motion/i.test(clean);
  if (animates && !respectsMotion) {
    out.push(finding(
      'no-reduced-motion',
      SEVERITY.WARNING,
      'Animation does not respect the reduced-motion setting',
      'The game animates but ignores the operating-system setting that asks for less '
        + 'motion. Some students get motion sickness or migraines from it.',
      'Ask your agent: "Wrap the animations in a @media (prefers-reduced-motion: reduce) '
        + 'query that shortens or removes them."',
      [],
    ));
  }

  const canvasOnly = tags.some((t) => t.name === 'canvas')
    && !tags.some((t) => t.name === 'button');
  if (canvasOnly) {
    out.push(finding(
      'canvas-only',
      SEVERITY.WARNING,
      'Play happens on a canvas with no real controls',
      'Everything drawn on a canvas is invisible to a screen reader, and there are no '
        + 'buttons to navigate. Playable Past allows this, but it must be disclosed to '
        + 'the instructor together with one non-game route to the same learning goal.',
      'Ask your agent: "Either add real button controls alongside the canvas, or write the '
        + 'accessibility limitation and an alternative activity into the teacher guide."',
      [],
    ));
  }

  const autoplay = tags.filter(
    (t) => ['audio', 'video'].includes(t.name) && t.attrs.autoplay !== undefined,
  );
  if (autoplay.length) {
    out.push(finding(
      'autoplay-media',
      SEVERITY.WARNING,
      'Audio or video starts on its own',
      'Sound that starts by itself is disruptive in a shared classroom and browsers often '
        + 'block it anyway.',
      'Ask your agent: "Remove autoplay and let the student press play."',
      autoplay.map((t) => ({ line: lineAt(t.offset), text: `<${t.name} autoplay>`, snippet: '' })),
    ));
  }

  return out;
}

/**
 * Offsets of storage uses that are not inside an open `try { ... }` block.
 * Walks the code (strings and comments already blanked) counting braces:
 * a try block that has already closed does not protect a later call.
 */
function unguardedStorage(code) {
  const re = /\b(?:localStorage|sessionStorage|indexedDB)\b/g;
  const uses = [];
  let m;
  while ((m = re.exec(code))) uses.push(m.index);
  if (!uses.length) return [];

  const stack = []; // true for a brace that opened a try block
  let openTries = 0;
  let u = 0;
  const unguarded = [];
  for (let i = 0; i < code.length && u < uses.length; i++) {
    while (u < uses.length && uses[u] === i) {
      if (openTries === 0) unguarded.push(i);
      u++;
    }
    const c = code[i];
    if (c === '{') {
      const isTry = /\btry\s*$/.test(code.slice(Math.max(0, i - 12), i));
      stack.push(isTry);
      if (isTry) openTries++;
    } else if (c === '}') {
      if (stack.pop()) openTries--;
    }
  }
  return unguarded;
}

/** Build standard: robustness and instructor ownership. */
function checkRobustness(ctx) {
  const { scripts, clean, text, lineAt, source, tags } = ctx;
  const out = [];

  const storageHits = [];
  for (const script of scripts) {
    if (!script.isJs) continue;
    // Strings blanked: 'localStorage' in window, or game text that mentions
    // localStorage, is not a storage call.
    for (const index of unguardedStorage(script.js.codeOnly)) {
      storageHits.push({ offset: script.offset + index });
    }
  }
  if (storageHits.length) {
    out.push(finding(
      'unguarded-storage',
      SEVERITY.WARNING,
      'Saved progress may crash the game',
      'The game reads or writes browser storage without a safety net. In a private window, '
        + 'or on a locked-down school device, that throws an error and can stop the game '
        + 'from starting.',
      'Ask your agent: "Wrap every localStorage call in try/catch so the game still plays '
        + 'when storage is blocked."',
      storageHits.slice(0, 5).map((h) => ({
        line: lineAt(h.offset),
        text: 'browser storage without try/catch',
        snippet: snippet(source, h.offset),
      })),
    ));
  }

  // "Again" alone is not a control: "The plague struck again" is prose. It
  // counts in a phrase such as "play again", or as a whole button label.
  const buttonLabels = [...ctx.markup.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button\s*>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, ' ').trim());
  const hasRestart = /\b(?:restart|replay|play again|play another|start over|start again|begin again|go again|new game|reset|try again)\b/i.test(text)
    || buttonLabels.some((label) => /^again\b/i.test(label))
    // CJK has no word boundaries, so those terms are matched without \b.
    || /再玩|重新開始|重新开始|重玩|やり直|다시\s?시작|إعادة/.test(text);
  if (!hasRestart) {
    out.push(finding(
      'no-restart',
      SEVERITY.WARNING,
      'No way to start over',
      'A class of thirty will produce at least one student who wants to replay, and at '
        + 'least one who gets stuck. Without a restart control their only option is to '
        + 'reload and hope.',
      'Ask your agent: "Add a visible restart control that resets the game to its opening state."',
      [],
    ));
  }

  // Read the raw source: the markers the build standard asks for ("EDIT
  // HERE") usually sit in comments. `CONTENT =` is matched case-sensitively
  // and only in script code, or every <meta content="..."> would count.
  const hasContentBlock = /GAME_?DATA|GAME_?CONTENT|EDIT (?:THIS|HERE|BELOW)|edit(?:able)? (?:this )?(?:content|data|block)|questions\s*[:=]\s*\[/i.test(source)
    || scripts.some((s) => /\bCONTENT\s*=/.test(s.code));
  if (!hasContentBlock) {
    out.push(finding(
      'no-content-block',
      SEVERITY.WARNING,
      'The content is not separated from the code',
      'Playable Past asks for the questions, events, and text to sit in one clearly marked '
        + 'data block near the top of the file, with a comment explaining how to edit it. '
        + 'That is what lets you update the game next year without an agent.',
      'Ask your agent: "Move all game text and data into a single clearly commented block '
        + 'near the top of the file, and add a note telling the instructor how to edit it."',
      [],
    ));
  }

  const debuggerHits = [];
  for (const script of scripts) {
    if (!script.isJs) continue;
    // Strings blanked: "The debugger of the ship" is game text, not a statement.
    const re = /\bdebugger\b/g;
    let m;
    while ((m = re.exec(script.js.codeOnly))) debuggerHits.push({ offset: script.offset + m.index });
  }
  if (debuggerHits.length) {
    out.push(finding(
      'debugger-statement',
      SEVERITY.WARNING,
      'A debugger statement was left in',
      'If a student has developer tools open, the game freezes at this line.',
      'Ask your agent: "Remove the debugger statements."',
      debuggerHits.map((h) => ({ line: lineAt(h.offset), text: 'debugger', snippet: '' })),
    ));
  }

  const title = tags.find((t) => t.name === 'title');
  if (!title) {
    out.push(finding(
      'no-title',
      SEVERITY.WARNING,
      'The page has no title',
      'The browser tab and the LMS link will show the filename instead of the game name.',
      'Ask your agent: "Add a <title> with the game name."',
      [],
    ));
  }

  return out;
}

function checkStructure(ctx) {
  const { source, bytes } = ctx;
  const out = [];

  if (!/<html[\s>]/i.test(source) || !/<body[\s>]/i.test(source)) {
    out.push(finding(
      'not-a-full-page',
      SEVERITY.BLOCKING,
      'This does not look like a complete HTML page',
      'A Playable Past game is one complete HTML document a teacher can double-click. This '
        + 'file is missing the <html> or <body> structure — it may be a fragment your agent '
        + 'gave you rather than the whole game.',
      'Ask your agent: "Give me the complete HTML file, from <!DOCTYPE html> to </html>, '
        + 'with nothing left out and no placeholders."',
      [],
    ));
  }

  // An ellipsis is a placeholder when it stands in for code: alone on a line,
  // or inside a comment ("// ...", "/* ... */", "<!-- ... -->"). An ellipsis
  // between words inside quoted text is punctuation — newspaper extracts and
  // dialogue are full of them — and must not be flagged.
  const placeholderPatterns = [
    /^[ \t]*(?:\/\/|\/\*|<!--|#)?[ \t]*(?:\.\.\.|\u2026)[ \t]*(?:\*\/|-->)?[ \t]*$/gm,
    // A `//` right after a colon, slash, word character, quote, `=`, or `(` is
    // part of a URL ("https://...", url(//host)), not a comment. A block comment only counts if the
    // ellipsis comes before it closes.
    /(?<![:/\w"'`=(])\/\/[^\n]*?(?:\.\.\.|\u2026)|\/\*(?:(?!\*\/)[^\n])*?(?:\.\.\.|\u2026)|<!--(?:(?!-->)[^\n])*?(?:\.\.\.|\u2026)/g,
    /\[insert[^\]]*\]|insert earlier[^.\n]*|rest of (?:the )?code[^.\n]*|your code here/gi,
    /\b(?:TODO|FIXME)\b/g, // case-sensitive: OCR noise such as "tOdO" is not a to-do marker
  ];
  const hits = [];
  for (const re of placeholderPatterns) {
    let m;
    while ((m = re.exec(source)) && hits.length < 6) hits.push({ offset: m.index, text: m[0].trim() });
  }
  hits.sort((a, b) => a.offset - b.offset);
  if (hits.length) {
    out.push(finding(
      'placeholder-content',
      SEVERITY.WARNING,
      'The file may contain placeholders instead of finished content',
      'Something in the file looks like a stand-in your agent meant to fill in later. If the '
        + 'game is missing a chunk of code, it will break partway through play.',
      'Ask your agent: "Check the file for placeholders, ellipses, and TODOs and give me the '
        + 'complete version with nothing omitted."',
      hits.map((h) => ({ line: ctx.lineAt(h.offset), text: h.text, snippet: snippet(source, h.offset) })),
    ));
  }

  if (bytes > SIZE_BLOCK) {
    out.push(finding(
      'file-too-large',
      SEVERITY.BLOCKING,
      `The file is very large (${formatBytes(bytes)})`,
      'Anything past 10 MB is slow to download over a lecture-hall network and may be '
        + 'refused by your LMS. It is almost always an oversized embedded image.',
      'Ask your agent: "Shrink the embedded images, or replace them with inline SVG, and '
        + 'get the file under 3 MB."',
      [],
    ));
  } else if (bytes > SIZE_WARN) {
    out.push(finding(
      'file-large',
      SEVERITY.WARNING,
      `The file is larger than usual (${formatBytes(bytes)})`,
      'Most single-file games sit well under 3 MB. A large file is slower to open on a '
        + 'classroom network, especially for thirty students at once.',
      'Ask your agent: "Reduce the embedded image sizes if you can do it without losing '
        + 'anything the game needs."',
      [],
    ));
  }

  return out;
}

/**
 * Playable Past hard rule 10. These are the checks a static read genuinely
 * cannot make. They are returned as work for a human, never as passes.
 */
export const MANUAL_CHECKS = Object.freeze([
  {
    id: 'manual-offline',
    title: 'Open the file with the wifi off',
    plain: 'Download the game, turn off your wifi, and double-click the file. Play one full '
      + 'round. Everything must look and work exactly as it did online.',
    minutes: 2,
  },
  {
    id: 'manual-keyboard',
    title: 'Play one step using only the keyboard',
    plain: 'Press Tab to move between controls and Enter or Space to activate them. You must '
      + 'be able to see which control is focused, and reach every control you need to play.',
    minutes: 2,
  },
  {
    id: 'manual-timing',
    title: 'Time one complete play-through',
    plain: 'Play from the opening screen to a real ending, with a clock running. It must fit '
      + 'inside your session with room for a briefing and the debrief.',
    minutes: 10,
  },
  {
    id: 'manual-classroom-setup',
    title: 'Open it once on the actual classroom setup',
    plain: 'Try it on the room computer or projector, and through your LMS if that is how '
      + 'students will get it. Do this a few days before class, not the night before.',
    minutes: 5,
  },
  {
    id: 'manual-provenance-accuracy',
    title: 'Read the Sources & assumptions screen against your own material',
    plain: 'A machine can confirm the screen exists; only you can confirm it is true. Check '
      + 'that every source listed is real, that the citations match your material, and that '
      + 'anything the agent supplied from its own memory is marked as unverified.',
    minutes: 10,
  },
  {
    id: 'manual-debrief',
    title: 'Check you have the debrief questions',
    plain: 'The debrief is part of the game, not an extra. You should have 3–6 questions that '
      + 'ask students to criticise the game as an interpretation of the past.',
    minutes: 2,
  },
].map((check) => Object.freeze(check)));

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

const CHECKS = [
  checkStructure,
  checkSelfContained,
  checkRemoteCss,
  checkNoNetwork,
  checkNoModelDependency,
  checkProvenance,
  checkAccessibility,
  checkRobustness,
];

/**
 * Validate one self-contained HTML game.
 *
 * @param {string} source  the full text of the .html file
 * @param {{filename?: string, bytes?: number}} meta
 * @returns {{
 *   filename: string, bytes: number,
 *   blocking: object[], warnings: object[], manual: object[],
 *   verdict: 'blocked'|'needs-work'|'ready-for-your-tests',
 *   summary: string,
 * }}
 */
export function validate(source, meta = {}) {
  const bytes = meta.bytes ?? byteLength(source);
  // HTML comments are blanked (offsets kept) before tags and scripts are
  // read, so a commented-out <script src> or <img> is not reported.
  const markup = blankHtmlComments(source);
  const ctx = {
    source,
    markup,
    clean: stripComments(markup),
    tags: scanTags(markup),
    scripts: scriptBodies(markup),
    text: readableText(markup),
    lineAt: lineIndex(source),
    bytes,
  };

  // `meta.checks` exists so the tests can prove that a failing check is
  // reported; normal callers never pass it.
  const checks = meta.checks || CHECKS;
  const findings = [];
  for (const check of checks) {
    try {
      findings.push(...check(ctx));
    } catch (err) {
      // Honesty rule: a check that did not finish did not pass. Its findings
      // are lost, so the file cannot be called ready — this is blocking.
      const area = CHECK_AREAS[check.name] || 'one part of the file';
      findings.push(finding(
        'checker-error',
        SEVERITY.BLOCKING,
        'The checker failed on part of this file',
        `The checker itself broke while looking at ${area}, so that part was not checked. `
          + 'Do not treat it as passed: the problems it looks for may still be there. '
          + 'This is a fault in the checker, not necessarily in your game.',
        'Test that part by hand for now, and report the file (or its shape) to the Playable '
          + 'Pasts maintainers as a checker bug. You can ask your agent: "Run the Playable '
          + 'Pasts checker on this file again and tell me which part it could not check."',
        [{ line: 0, text: `${check.name || 'check'}: ${String((err && err.message) || err)}`, snippet: '' }],
      ));
    }
  }

  const blocking = findings.filter((f) => f.severity === SEVERITY.BLOCKING);
  const warnings = findings.filter((f) => f.severity === SEVERITY.WARNING);

  let verdict;
  if (blocking.length) verdict = 'blocked';
  else if (warnings.length) verdict = 'needs-work';
  else verdict = 'ready-for-your-tests';

  const unchecked = blocking.filter((f) => f.id === 'checker-error').length;

  return {
    filename: meta.filename || 'game.html',
    bytes,
    blocking,
    warnings,
    // A fresh copy per report: changing one report must never erase the
    // manual checks from the next one.
    manual: MANUAL_CHECKS.map((check) => ({ ...check })),
    verdict,
    summary: summarise(verdict, blocking.length - unchecked, warnings.length, unchecked),
  };
}

/** Plain names for each check, used when one of them fails. */
const CHECK_AREAS = {
  checkStructure: 'whether the file is a complete page',
  checkSelfContained: 'files the page loads',
  checkRemoteCss: 'files the styling loads',
  checkNoNetwork: 'network use during play',
  checkNoModelDependency: 'AI model use and secret keys',
  checkProvenance: 'the Sources & assumptions screen',
  checkAccessibility: 'accessibility',
  checkRobustness: 'saving, restarting, and editing the game',
};

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve'];

function manualCount() {
  const n = MANUAL_CHECKS.length;
  return `${NUMBER_WORDS[n] ?? n} test${n === 1 ? '' : 's'}`;
}

function summarise(verdict, nBlocking, nWarnings, nUnchecked = 0) {
  if (verdict === 'blocked') {
    const parts = [];
    if (nBlocking) {
      parts.push(`${nBlocking} problem${nBlocking === 1 ? '' : 's'} will stop this game working in a `
        + 'classroom. Fix those first — the wording below is written to paste straight to your agent.');
    }
    if (nUnchecked) {
      parts.push(`The checker failed on ${nUnchecked === 1 ? 'one part' : `${nUnchecked} parts`} `
        + 'of this file, so that part was not checked. Do not treat this game as passed until it has been.');
    }
    return parts.join(' ');
  }
  if (verdict === 'needs-work') {
    return `Nothing here will stop the game running, but ${nWarnings} thing`
      + `${nWarnings === 1 ? '' : 's'} would make it better for your students. `
      + `Then run the ${manualCount()} only you can do.`;
  }
  return 'Every automated check passed. That means the file is self-contained and structurally '
    + `sound — it does not mean the game is good history or good teaching. Run the ${manualCount()} below.`;
}

function byteLength(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
  return Buffer.byteLength(str, 'utf8');
}
