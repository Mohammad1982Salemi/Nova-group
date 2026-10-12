// ---------------------------------------------------------------- French, German, Turkish
// The same four tables as the Persian ones, in the same order: a known text, a pattern (by its place in the list of
// patterns: {n} is a captured value, [n|...] a piece that is there only when value n is), a phrase (by its place in
// the list of phrases), and the glossary.
/*TABLES*/
const LX = {
  fa: { rtl: true, dict: FA, rules: FA_RC.map((r) => r[1]), phrases: FA_P.map((p) => p[1]), gloss: FA_GLOSS, join: FA_JOIN, colon: ":" },
  fr: { dict: FR, rules: FR_R, phrases: FR_P, gloss: FR_GLOSS, join: ["   |   ", " · ", " ", " ; "], colon: "\u00a0:" },
  de: { dict: DE, rules: DE_R, phrases: DE_P, gloss: DE_GLOSS, join: ["   |   ", " · ", " ", "; "], colon: ":" },
  tr: { dict: TR, rules: TR_R, phrases: TR_P, gloss: TR_GLOSS, join: ["   |   ", " · ", " ", "; "], colon: ":" },
};
const LX_RX = FA_RC.map((r) => r[0]);      // the patterns are matched on the English text, whatever the language shown
let CUR = null, rlShow = () => { };         // the tables of the language being shown (none for English); the menu's own display
const lxMemo = new Map(), lxText = new WeakMap(), lxAttr = new WeakMap();   // what has been put on screen already is never translated twice
function lxUse() { CUR = LX[LANG] || null; lxMemo.clear();
  if (CUR && !CUR.pc) { const esc2 = (p) => p.replace(/[.*+?^$()|[\]\\]/g, "\\$&"), list = FA_P.map((p, i) => [p[0], CUR.phrases[i]]).sort((a, b) => b[0].length - a[0].length);
    CUR.pc = list.map((p) => [new RegExp("(?<![A-Za-z])" + esc2(p[0]) + "(?![A-Za-z])", "g"), p[1]]);
    // a language written in Latin letters is done in one pass, so that a word already translated is never taken for an English one
    if (!CUR.rtl) { CUR.pmap = new Map(list); CUR.pone = new RegExp("(?<![A-Za-z])(?:" + list.map((p) => esc2(p[0])).join("|") + ")(?![A-Za-z])", "g"); } } }
function lxPhr(t) { if (!/[A-Za-z]/.test(t)) return t;
  if (CUR.pone) return /^\S+\.[A-Za-z]{2,4}$/.test(t) ? t : t.replace(CUR.pone, (m) => CUR.pmap.get(m));     // a file name is left as it is
  CUR.pc.forEach((p) => { t = t.replace(p[0], p[1]); }); return t; }
function lxExact(t) { const d = CUR.dict; if (d[t] != null) return d[t]; if (t.length > 1 && t.endsWith(":") && d[t.slice(0, -1)] != null) return d[t.slice(0, -1)] + CUR.colon; return null; }
function lxFill(tpl, m) { let out = "", i = 0;
  while (i < tpl.length) { const three = tpl.substr(i, 3);
    if (/^\[\d\|$/.test(three)) { let depth = 1, j = i + 3;
      while (j < tpl.length && depth) { if (/^\[\d\|$/.test(tpl.substr(j, 3))) depth++; else if (tpl[j] === "]") depth--; j++; }
      const v = m[+tpl[i + 1]]; if (v != null && v !== "") out += lxFill(tpl.slice(i + 3, j - 1), m); i = j; }
    else if (/^\{\d\}$/.test(three)) { const v = m[+tpl[i + 1]]; out += v == null ? "" : CUR.dict[v] != null ? CUR.dict[v] : lxPhr(v); i += 3; }
    else { out += tpl[i]; i++; } }
  return out; }
function lxRules(t) { for (let i = 0; i < LX_RX.length; i++) { const m = LX_RX[i].exec(t); if (m) { const r = CUR.rules[i]; return typeof r === "function" ? r(m) : lxFill(r, m); } } return null; }
// a known text; else its parts (bar, dot, sentence); a pattern is tried on ONE sentence, then on its clauses; else phrase by phrase
function lxAny(t, level) { const c = lxExact(t); if (c != null) return c;
  if (level < 3) { const parts = t.split(FA_SEPS[level]); return parts.length > 1 ? parts.map((p) => lxAny(p.trim(), level + 1)).join(CUR.join[level]) : lxAny(t, level + 1); }
  const r = lxRules(t); if (r != null) return r;
  const parts = t.split("; "); if (parts.length < 2) return lxPhr(t);
  return parts.map((p) => { p = p.trim(); const e = lxExact(p); if (e != null) return e; const q = lxRules(p); return q != null ? q : lxPhr(p); }).join(CUR.join[3]); }
// right-to-left only: numbers with a sign, money, dates and durations stay left-to-right inside the text
function lxBidi(t) { if (t.indexOf(LRI) >= 0) return t;
  return t.replace(/\d{4}-\d\d-\d\d(?:[ T]\d\d:\d\d(?::\d\d)?(?:\.\d+)?)?(?: UTC)?(?:\s*→\s*\d{4}-\d\d-\d\d(?: \d\d:\d\d)?(?: UTC)?)?|[-+]?\$[\d,]+(?:\.\d+)?[kM]?|[-+]?\d[\d,]*(?:\.\d+)?\s?R(?![A-Za-z])|[-+]\d[\d,]*(?:\.\d+)?%?|\d[\d,.]*\s?(?:ms|µs|ns|min|h|d|s)(?![A-Za-z])(?: \d+ (?:s|min|h)(?![A-Za-z]))*/g, (m) => LRI + m + PDI); }
function lxString(v) { let out = lxMemo.get(v); if (out !== undefined) return out; const t = v.trim();
  if (!t) out = v; else if (/[A-Za-z]/.test(t)) out = v.replace(t, () => CUR.rtl ? lxBidi(lxAny(t, 0)) : lxAny(t, 0)); else out = CUR.rtl && /\d\s+\d|^[-+]|→|\$/.test(t) ? v.replace(t, () => LRI + t + PDI) : v;
  if (lxMemo.size < 30000) lxMemo.set(v, out); return out; }
const LX_SKIP = "script,style,.note,.nofa,#c_in tbody,#langbar";
function lxTree(root) { if (!CUR || !root) return;
  const say = (n) => { if (lxText.get(n) === n.nodeValue) return; const o = lxString(n.nodeValue); if (o !== n.nodeValue) n.nodeValue = o; lxText.set(n, o); };
  if (root.nodeType === 3) { if (root.parentNode && root.parentNode.closest && !root.parentNode.closest(LX_SKIP)) say(root); return; }
  if (root.nodeType !== 1 || root.closest(LX_SKIP)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = []; while (w.nextNode()) list.push(w.currentNode);
  list.forEach((n) => { if (!n.parentNode.closest(LX_SKIP)) say(n); });
  (root.matches("[title],[placeholder]") ? [root] : []).concat([...root.querySelectorAll("[title],[placeholder]")]).forEach((e) => ["title", "placeholder"].forEach((a) => { const t = e.getAttribute(a), done = lxAttr.get(e) || {};
    if (t && done[a] !== t && /[A-Za-z]/.test(t) && !e.closest(LX_SKIP)) { done[a] = lxAny(t.trim(), 0); e.setAttribute(a, done[a]); lxAttr.set(e, done); } })); }
function setLang(l) { LANG = LX[l] ? l : "en"; try { localStorage.setItem("tm_report_lang", LANG); } catch (e) { }
  lxUse();
  document.documentElement.lang = LANG; document.documentElement.dir = CUR && CUR.rtl ? "rtl" : "ltr";
  rlShow(LANG);
  const g = document.getElementById("gloss"); if (g) g.style.display = "none"; if (DATA) render(); }
new MutationObserver((ms) => { if (!CUR) return; ms.forEach((m) => m.addedNodes.forEach(lxTree)); }).observe(document.body, { childList: true, subtree: true });
