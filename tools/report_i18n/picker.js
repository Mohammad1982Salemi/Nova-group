// ---------------------------------------------------------------- the language menu (the same in every report)
// Five languages, each shown with its flag and its own name. The choice is kept under one key for all reports;
// a report opened from the site with ?lang=fr opens in that language.
const RL_LANGS = [["en", "English"], ["fr", "Français"], ["de", "Deutsch"], ["tr", "Türkçe"], ["fa", "فارسی"]];
const RL_FLAGS = /*FLAGS*/;
function rlStart() {     // asked for in the address; else the last choice made in a report; else the one made on the site; else English
  let l = null;
  try { const q = /[?&]lang=([a-z]{2})\b/.exec(location.search); l = q ? q[1] : localStorage.getItem("tm_report_lang") || localStorage.getItem("nova-lang"); } catch (e) { }
  return RL_LANGS.some((x) => x[0] === l) ? l : "en";
}
function rlMenu(pick) {  // builds the menu into #langbar; returns the function that shows which language is on
  const bar = document.getElementById("langbar"), box = document.createElement("div"), btn = document.createElement("button"), menu = document.createElement("ul"), face = document.createElement("span");
  const flag = (l) => { const i = document.createElement("img"); i.className = "lp-flag"; i.alt = ""; i.src = RL_FLAGS[l]; return i; };
  box.className = "lp"; menu.className = "lp-menu";
  btn.type = "button"; btn.className = "lp-btn"; btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
  btn.append(flag("en"), face);
  btn.insertAdjacentHTML("beforeend", '<svg class="lp-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
  RL_LANGS.forEach((x) => { const li = document.createElement("li"), b = document.createElement("button"), s = document.createElement("span");
    b.type = "button"; b.lang = x[0]; b.setAttribute("data-lang", x[0]); s.textContent = x[1]; b.append(flag(x[0]), s); li.appendChild(b); menu.appendChild(li); });
  const shut = () => { box.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => { btn.setAttribute("aria-expanded", box.classList.toggle("open") ? "true" : "false"); });
  menu.addEventListener("click", (e) => { const b = e.target.closest("button[data-lang]"); if (!b) return;
    shut(); btn.focus();
    try { const u = new URL(location.href); if (u.searchParams.has("lang")) { u.searchParams.delete("lang"); history.replaceState(null, "", u); } } catch (err) { }
    pick(b.getAttribute("data-lang")); });
  document.addEventListener("click", (e) => { if (!box.contains(e.target)) shut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") shut(); });
  box.append(btn, menu); bar.replaceChildren(box);
  return (l) => { const cur = RL_LANGS.find((x) => x[0] === l) || RL_LANGS[0];
    btn.firstChild.src = RL_FLAGS[cur[0]]; face.textContent = cur[1]; btn.setAttribute("aria-label", cur[1]);
    menu.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", b.getAttribute("data-lang") === cur[0] ? "true" : "false")); };
}
