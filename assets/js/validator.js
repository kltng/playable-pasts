/**
 * Playable Past — classroom-readiness validator.
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

/**
 * Block and line comments, for JavaScript bodies only. A `//` that opens a
 * comment is never preceded by a colon or a quote — inside JS, a
 * protocol-relative URL is always quoted.
 */
function stripJsComments(code) {
  const out = blankOut(code, /\/\*[\s\S]*?\*\//g);
  return out.replace(
    /(^|[^:"'`\\])\/\/[^\n]*/g,
    (m, lead) => lead + ' '.repeat(m.length - lead.length),
  );
}

/** Is this URL fetched from somewhere other than the file itself? */
function isRemote(url) {
  const u = String(url).trim();
  return /^(https?:)?\/\//i.test(u) || /^(ftp|ws|wss):/i.test(u);
}

/** Inline data that costs nothing at play time. */
function isInline(url) {
  return /^(data:|blob:|#|javascript:|about:)/i.test(String(url).trim());
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
    attrs[m[1].toLowerCase()] = value;
  }
  return attrs;
}

/** Every tag in the document, with attributes and byte offset. */
function scanTags(source) {
  const tags = [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(source))) {
    tags.push({
      name: m[1].toLowerCase(),
      attrs: parseAttrs(m[2] || ''),
      offset: m.index,
      raw: m[0],
    });
  }
  return tags;
}

/** Text content with all tags removed — what a player can actually read. */
function visibleText(source) {
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
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
  return (visibleText(source) + ' ' + strings.join(' ')).replace(/\s+/g, ' ');
}

/** Contents of every <script> block, for code-only checks. */
function scriptBodies(source) {
  const bodies = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(source))) {
    const attrs = parseAttrs(m[1] || '');
    if (attrs.src) continue; // external, handled elsewhere
    bodies.push({ code: m[2], offset: m.index + m[0].indexOf(m[2]) });
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
};

function checkSelfContained(ctx) {
  const { tags, lineAt, source } = ctx;
  const out = [];

  const externalScripts = [];
  const externalStyles = [];
  const externalAssets = [];
  const externalPreloads = [];

  for (const tag of tags) {
    const a = tag.attrs;

    if (tag.name === 'script' && a.src && isRemote(a.src)) {
      externalScripts.push({ tag, url: a.src });
      continue;
    }

    if (tag.name === 'link') {
      const rel = (a.rel || '').toLowerCase();
      const href = a.href || '';
      if (!href || isInline(href)) continue;
      if (isRemote(href)) {
        if (/stylesheet/.test(rel)) externalStyles.push({ tag, url: href });
        else if (/preload|prefetch|modulepreload|preconnect|dns-prefetch/.test(rel)) {
          externalPreloads.push({ tag, url: href });
        } else if (/icon|manifest/.test(rel)) {
          externalAssets.push({ tag, url: href, what: `link rel="${rel}"` });
        }
      }
      continue;
    }

    const attrNames = ASSET_TAGS[tag.name];
    if (!attrNames) continue;
    for (const name of attrNames) {
      const value = a[name];
      if (!value || isInline(value)) continue;
      // srcset holds a comma-separated candidate list
      const urls = name === 'srcset'
        ? value.split(',').map((s) => s.trim().split(/\s+/)[0])
        : [value];
      for (const url of urls) {
        if (url && isRemote(url)) {
          externalAssets.push({ tag, url, what: `<${tag.name} ${name}>` });
        }
      }
    }
  }

  if (externalScripts.length) {
    out.push(finding(
      'external-script',
      SEVERITY.BLOCKING,
      'The game loads JavaScript from the internet',
      'Your game pulls code from another website while it runs. On a classroom '
        + 'network that blocks it — or with the wifi off — the game will not start at all.',
      'Ask your agent: "Inline every external script directly into the HTML file so '
        + 'the game has no <script src> pointing at a website."',
      externalScripts.map(({ tag, url }) => ({
        line: lineAt(tag.offset),
        text: url,
        snippet: snippet(source, tag.offset),
      })),
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
      externalStyles.map(({ tag, url }) => ({
        line: lineAt(tag.offset),
        text: url,
        snippet: snippet(source, tag.offset),
      })),
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
      externalAssets.map(({ tag, url, what }) => ({
        line: lineAt(tag.offset),
        text: `${what} → ${url}`,
        snippet: snippet(source, tag.offset),
      })),
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
      externalPreloads.map(({ tag, url }) => ({
        line: lineAt(tag.offset),
        text: url,
        snippet: snippet(source, tag.offset),
      })),
    ));
  }

  return out;
}

function checkRemoteCss(ctx) {
  const { clean, lineAt, source } = ctx;
  const out = [];
  const hits = [];

  const imports = /@import\s+(?:url\(\s*)?["']?((?:https?:)?\/\/[^"')\s]+)/gi;
  let m;
  while ((m = imports.exec(clean))) {
    hits.push({ offset: m.index, url: m[1], kind: '@import' });
  }
  const urls = /url\(\s*["']?((?:https?:)?\/\/[^"')\s]+)/gi;
  while ((m = urls.exec(clean))) {
    hits.push({ offset: m.index, url: m[1], kind: 'url()' });
  }

  // An `@import url(...)` matches both patterns above; keep one row per resource.
  const seen = new Set();
  const unique = hits.filter((h) => {
    const key = h.url.replace(/^https?:/i, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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
      unique.map((h) => ({
        line: lineAt(h.offset),
        text: `${h.kind} → ${h.url}`,
        snippet: snippet(source, h.offset),
      })),
    ));
  }

  return out;
}

/**
 * Rule 12 & the build standard: no network calls at play time, and no
 * dependency on an AI provider.
 */
const NETWORK_APIS = [
  ['fetch', /\bfetch\s*\(/g, 'fetch()'],
  ['xhr', /\bnew\s+XMLHttpRequest\b/g, 'XMLHttpRequest'],
  ['websocket', /\bnew\s+WebSocket\b/g, 'WebSocket'],
  ['eventsource', /\bnew\s+EventSource\b/g, 'EventSource'],
  ['beacon', /navigator\s*\.\s*sendBeacon\s*\(/g, 'navigator.sendBeacon()'],
  ['importscripts', /\bimportScripts\s*\(/g, 'importScripts()'],
  ['dynamic-import', /\bimport\s*\(\s*["'](?:https?:)?\/\//g, 'dynamic import() of a URL'],
];

function checkNoNetwork(ctx) {
  const { scripts, lineAt, source } = ctx;
  const out = [];
  const hits = [];

  for (const { code, offset } of scripts) {
    const clean = stripJsComments(code);
    for (const [, re, label] of NETWORK_APIS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(clean))) {
        hits.push({ offset: offset + m.index, label });
      }
    }
  }

  if (hits.length) {
    out.push(finding(
      'network-during-play',
      SEVERITY.BLOCKING,
      'The game makes network requests while it is played',
      'The code calls out to a server during play. Playable Past requires no network '
        + 'traffic once the game is open, so it works from a USB stick, an LMS download, '
        + 'or a room with no wifi.',
      'Ask your agent: "Remove all network calls. Move whatever the game was fetching '
        + 'into the inline data block so it ships inside the file."',
      hits.map((h) => ({
        line: lineAt(h.offset),
        text: h.label,
        snippet: snippet(source, h.offset),
      })),
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
    while ((m = re.exec(clean))) keyHits.push({ offset: m.index, label });
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

  const hasScreen = /sources?\s*(?:&|and|\+|·|\/)?\s*assumptions?/i.test(text)
    || (/\bsources?\b/i.test(text) && /\bassumptions?\b/i.test(text));

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

  const labelsInvented = /\b(invented|fictional|fictionali[sz]ed|imagined|reconstructed|counterfactual|illustrative|assumption)\b/i.test(text);
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

  const hasCharset = tags.some(
    (t) => t.name === 'meta'
      && ((t.attrs.charset || '').toLowerCase().includes('utf-8')
        || /charset=utf-8/i.test(t.attrs.content || '')),
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

  const animates = /@keyframes|animation\s*:|transition\s*:/i.test(clean);
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

/** Build standard: robustness and instructor ownership. */
function checkRobustness(ctx) {
  const { scripts, clean, text, lineAt, source, tags } = ctx;
  const out = [];

  const storageHits = [];
  for (const { code, offset } of scripts) {
    const stripped = stripJsComments(code);
    const re = /\b(?:localStorage|sessionStorage|indexedDB)\b/g;
    let m;
    while ((m = re.exec(stripped))) {
      // Look backwards for a try block that plausibly wraps this call.
      const before = stripped.slice(Math.max(0, m.index - 400), m.index);
      if (!/\btry\s*\{[^}]*$/.test(before) && !/\btry\s*\{/.test(before)) {
        storageHits.push({ offset: offset + m.index });
      }
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

  const hasRestart = /\b(?:restart|play again|start over|new game|reset|try again|again)\b/i.test(text)
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

  const hasContentBlock = /GAME_?DATA|GAME_?CONTENT|CONTENT\s*=|EDIT (?:THIS|HERE|BELOW)|edit(?:able)? (?:this )?(?:content|data|block)|questions\s*[:=]\s*\[/i.test(clean);
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
  for (const { code, offset } of scripts) {
    const re = /\bdebugger\b/g;
    let m;
    const stripped = stripJsComments(code);
    while ((m = re.exec(stripped))) debuggerHits.push({ offset: offset + m.index });
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

  if (/\.\.\.|\[insert|insert earlier|rest of (?:the )?code|your code here|TODO|FIXME/i.test(source)) {
    const re = /(\.\.\.|\[insert[^\]]*\]|insert earlier[^.\n]*|rest of (?:the )?code[^.\n]*|your code here|TODO|FIXME)/gi;
    const hits = [];
    let m;
    while ((m = re.exec(source)) && hits.length < 6) hits.push({ offset: m.index, text: m[1] });
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
export const MANUAL_CHECKS = [
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
];

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
  const ctx = {
    source,
    clean: stripComments(source),
    tags: scanTags(source),
    scripts: scriptBodies(source),
    text: readableText(source),
    lineAt: lineIndex(source),
    bytes,
  };

  const findings = [];
  for (const check of CHECKS) {
    try {
      findings.push(...check(ctx));
    } catch (err) {
      findings.push(finding(
        'checker-error',
        SEVERITY.WARNING,
        'One check could not finish',
        `The validator hit an internal error while running ${check.name}. The rest of the `
          + 'report is still valid, but treat this area as unchecked.',
        'Please report this file (or its shape) as a validator bug.',
        [{ line: 0, text: String(err && err.message || err), snippet: '' }],
      ));
    }
  }

  const blocking = findings.filter((f) => f.severity === SEVERITY.BLOCKING);
  const warnings = findings.filter((f) => f.severity === SEVERITY.WARNING);

  let verdict;
  if (blocking.length) verdict = 'blocked';
  else if (warnings.length) verdict = 'needs-work';
  else verdict = 'ready-for-your-tests';

  return {
    filename: meta.filename || 'game.html',
    bytes,
    blocking,
    warnings,
    manual: MANUAL_CHECKS,
    verdict,
    summary: summarise(verdict, blocking.length, warnings.length),
  };
}

function summarise(verdict, nBlocking, nWarnings) {
  if (verdict === 'blocked') {
    return `${nBlocking} problem${nBlocking === 1 ? '' : 's'} will stop this game working in a `
      + 'classroom. Fix those first — the wording below is written to paste straight to your agent.';
  }
  if (verdict === 'needs-work') {
    return `Nothing here will stop the game running, but ${nWarnings} thing`
      + `${nWarnings === 1 ? '' : 's'} would make it better for your students. `
      + 'Then run the six tests only you can do.';
  }
  return 'Every automated check passed. That means the file is self-contained and structurally '
    + 'sound — it does not mean the game is good history or good teaching. Run the six tests below.';
}

function byteLength(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
  return Buffer.byteLength(str, 'utf8');
}
