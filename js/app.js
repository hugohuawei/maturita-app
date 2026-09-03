/* ==================================================================
   Maturita 2027 — retrieval loop
   Stav v localStorage, katalóg v js/catalog.js, žiadny backend.
================================================================== */

const KEY = 'maturita.v1';
const ROUND_DEFAULT = 5;
const TIMER_SECONDS = 90;

/* ---------- pomôcky ---------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowISO = () => new Date().toISOString();
const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const CATALOG = new Map(TOPICS.map((t) => [t.id, t]));
const SUBJ = new Map(SUBJECTS.map((s) => [s.key, s]));
const GRADES = { V: 'Viem', C: 'Čiastočne', N: 'Neviem' };
const GLYPH = { V: '●', C: '◐', N: '○' };

function plural(n, one, few, many) {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
}
function daysBetween(iso) {
  if (!iso) return null;
  const a = new Date(dayKey(new Date(iso))), b = new Date(dayKey());
  return Math.round((b - a) / 86400000);
}
function relDay(iso) {
  const d = daysBetween(iso);
  if (d === null) return 'nikdy';
  if (d === 0) return 'dnes';
  if (d === 1) return 'včera';
  if (d < 14) return `pred ${d} ${plural(d, 'dňom', 'dňami', 'dňami')}`;
  const w = Math.floor(d / 7);
  return `pred ${w} ${plural(w, 'týždňom', 'týždňami', 'týždňami')}`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

/* ---------- stav -------------------------------------------------- */
function freshState() {
  return { version: 1, queue: [], topics: {}, round: null, history: [],
           settings: { roundSize: ROUND_DEFAULT, timer: true } };
}

let state = load();

function load() {
  let s;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch { s = null; }
  if (!s || typeof s !== 'object') s = freshState();
  return reconcile(s);
}

/* Spáruje uložený stav s katalógom. Nové témy idú na začiatok frontu,
   zmiznuté z katalógu vypadnú z frontu. Postup sa nikdy nestratí. */
function reconcile(s) {
  s.version ??= 1;
  s.topics ??= {};
  s.queue ??= [];
  s.history ??= [];
  s.settings = Object.assign({ roundSize: ROUND_DEFAULT, timer: true }, s.settings);
  s.settings.roundSize = Math.min(10, Math.max(3, s.settings.roundSize | 0 || ROUND_DEFAULT));

  const known = new Set();
  s.queue = s.queue.filter((id) => CATALOG.has(id) && !known.has(id) && known.add(id));

  const fresh = [];
  for (const t of TOPICS) {
    if (!s.topics[t.id]) {
      s.topics[t.id] = { grade: null, last: null, count: 0,
                         paused: !!t.paused, note: '', title: null, nSince: null };
    }
    if (!known.has(t.id)) fresh.push(t.id);
  }
  if (fresh.length) s.queue.unshift(...fresh);

  if (s.round && (!Array.isArray(s.round.ids) || !s.round.ids.every((id) => CATALOG.has(id)))) s.round = null;
  return s;
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('localStorage sa nepodarilo zapísať', e); }
  }, 80);
}

/* ---------- odvodené dáta ---------------------------------------- */
const st = (id) => state.topics[id];
const titleOf = (id) => st(id)?.title || CATALOG.get(id).title;
const isActive = (id) => !st(id).paused;

function counts(ids) {
  const c = { V: 0, C: 0, N: 0, U: 0, total: ids.length, paused: 0 };
  for (const id of ids) {
    const t = st(id);
    if (t.paused) c.paused++;
    if (t.grade) c[t.grade]++; else c.U++;
  }
  return c;
}
const idsOf = (pred) => TOPICS.filter(pred).map((t) => t.id);
const nList = () => TOPICS.map((t) => t.id).filter((id) => st(id).grade === 'N')
  .sort((a, b) => (st(a).nSince || '') .localeCompare(st(b).nSince || ''));

/* ---------- radiaci algoritmus ------------------------------------
   V → úplný koniec frontu
   Č → pozícia ≈ 1/3 dĺžky frontu
   N → pozícia 5 od začiatku
------------------------------------------------------------------ */
function requeue(id, grade) {
  const i = state.queue.indexOf(id);
  if (i >= 0) state.queue.splice(i, 1);
  const len = state.queue.length;
  const pos = grade === 'V' ? len
            : grade === 'C' ? Math.max(0, Math.round(len / 3))
            : Math.min(5, len);
  state.queue.splice(pos, 0, id);
}

function grade(id, g) {
  const t = st(id);
  t.nSince = g === 'N' ? (t.grade === 'N' ? t.nSince : nowISO()) : null;
  t.grade = g;
  t.last = nowISO();
  t.count = (t.count || 0) + 1;
  requeue(id, g);
  logDay(1);
  save();
}

/* ---------- denný snapshot ---------------------------------------- */
function logDay(gradedDelta = 0) {
  const d = dayKey();
  let e = state.history[state.history.length - 1];
  if (!e || e.d !== d) { e = { d, graded: 0 }; state.history.push(e); }
  e.graded += gradedDelta;
  const c = counts(TOPICS.map((t) => t.id));
  e.v = c.V; e.c = c.C; e.n = c.N; e.u = c.U;
  if (state.history.length > 400) state.history = state.history.slice(-400);
}

/** priemerné tempo tém/deň za posledných 14 dní */
function pace() {
  const cutoff = dayKey(new Date(Date.now() - 13 * 86400000));
  const recent = state.history.filter((e) => e.d >= cutoff);
  if (!recent.length) return 0;
  const first = new Date(recent[0].d), today = new Date(dayKey());
  const span = Math.max(1, Math.round((today - first) / 86400000) + 1);
  return recent.reduce((a, e) => a + (e.graded || 0), 0) / span;
}

/* ---------- kolo --------------------------------------------------- */
function startRound() {
  const ids = [];
  for (const id of state.queue) {
    if (isActive(id)) ids.push(id);
    if (ids.length >= state.settings.roundSize) break;
  }
  state.round = ids.length ? { ids, idx: 0, V: 0, C: 0, N: 0 } : null;
  save();
}
function answer(g) {
  const r = state.round;
  if (!r || r.idx >= r.ids.length) return;
  grade(r.ids[r.idx], g);
  r[g]++;
  r.idx++;
  save();
  advanceCard();
}

/* ---------- časovač ------------------------------------------------ */
const timer = { running: false, done: false };
function resetTimer(autostart) {
  const bar = $('#timerbar');
  timer.done = false;
  if (!bar) return;
  bar.classList.remove('done');
  bar.style.animation = 'none';
  void bar.offsetWidth;
  bar.style.animation = '';
  timer.running = !!autostart && state.settings.timer;
  bar.style.animationPlayState = timer.running ? 'running' : 'paused';
  bar.style.opacity = state.settings.timer ? '' : '0';
}
function toggleTimer() {
  if (!state.settings.timer || timer.done) return;
  const bar = $('#timerbar');
  if (!bar) return;
  timer.running = !timer.running;
  bar.style.animationPlayState = timer.running ? 'running' : 'paused';
}

/* ---------- router -------------------------------------------------- */
const ROUTES = ['dnes', 'prehlad', 'temy', 'n', 'system'];
const route = () => {
  const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  return ROUTES.includes(h) ? h : 'dnes';
};

function render() {
  const r = route();
  $$('.tab').forEach((b) => b.setAttribute('aria-current', b.dataset.route === r ? 'page' : 'false'));
  const app = $('#app');
  app.className = 'screen screen--' + r;
  app.innerHTML = ({ dnes: viewRound, prehlad: viewOverview, temy: viewTopics,
                     n: viewN, system: viewSystem })[r]();
  if (r === 'dnes') afterRound();
  if (r === 'prehlad') drawChart();
  app.scrollTop = 0;
}

window.addEventListener('hashchange', render);

/* ==================================================================
   A. DNEŠNÉ KOLO
================================================================== */
function viewRound() {
  const r = state.round;
  if (!r) return roundIntro();
  if (r.idx >= r.ids.length) return roundSummary(r);

  const id = r.ids[r.idx];
  const t = CATALOG.get(id);
  const s = SUBJ.get(t.subject);
  const parts = titleOf(id).split(' · ');

  return `
    <div class="timer" aria-hidden="true"><div id="timerbar" class="timer__bar"></div></div>
    <div class="round">
      <div class="round__meta">
        <span>${r.idx + 1} / ${r.ids.length}</span>
        <span>${esc(s.short)}${t.tc ? ' · ' + esc(t.tc) : ''}</span>
      </div>
      <div class="card" id="card">
        <div class="card__num">${esc(s.short)} ${t.num}</div>
        <h1 class="card__title">${parts.map((p) => `<span>${esc(p)}</span>`).join('')}</h1>
      </div>
      <div class="answers">
        ${['V', 'C', 'N'].map((g) => `
          <button class="ans ans--${g}" data-answer="${g}">
            <span class="ans__glyph" aria-hidden="true">${GLYPH[g]}</span>
            <span class="ans__label">${GRADES[g]}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function roundIntro() {
  const active = idsOf((t) => isActive(t.id));
  const next = state.queue.filter(isActive).slice(0, state.settings.roundSize);
  return `
    <div class="pad">
      <h1 class="h1">Dnešné kolo</h1>
      <p class="lede">${state.settings.roundSize} ${plural(state.settings.roundSize, 'téma', 'témy', 'tém')} z frontu.
        V rade stojí ${active.length} aktívnych tém.</p>
      <button class="primary" data-act="start">Začať kolo</button>
      <div class="rowlabel">Na rade</div>
      <ol class="preview">
        ${next.map((id) => {
          const t = CATALOG.get(id);
          return `<li><span class="mono">${esc(SUBJ.get(t.subject).short)} ${t.num}</span></li>`;
        }).join('') || '<li class="muted">Front je prázdny — všetko je pozastavené.</li>'}
      </ol>
      <div class="sizectl">
        <span>Tém na kolo</span>
        <div class="stepper">
          <button data-act="size-" aria-label="menej">−</button>
          <b>${state.settings.roundSize}</b>
          <button data-act="size+" aria-label="viac">+</button>
        </div>
      </div>
    </div>`;
}

function roundSummary(r) {
  return `
    <div class="pad">
      <h1 class="h1">Kolo hotové</h1>
      <div class="tally">
        ${['V', 'C', 'N'].map((g) => `
          <div class="tally__item tally__item--${g}">
            <span class="tally__glyph" aria-hidden="true">${GLYPH[g]}</span>
            <b>${r[g]}</b><span>${GRADES[g]}</span>
          </div>`).join('')}
      </div>
      <button class="primary" data-act="start">Ďalšie kolo</button>
      <button class="ghost" data-act="end">Skončiť</button>
    </div>`;
}

function afterRound() {
  const r = state.round;
  if (r && r.idx < r.ids.length) resetTimer(true);
}

function advanceCard() {
  const card = $('#card');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!card || reduce) return render();
  card.classList.add('card--out');
  setTimeout(render, 160);
}

/* ==================================================================
   B. PREHĽAD
================================================================== */
function viewOverview() {
  const all = TOPICS.map((t) => t.id);
  const c = counts(all);
  const active = all.filter(isActive);
  const p = pace();
  const weeks = p > 0 ? (active.length / p / 7) : null;
  const lastAll = all.map((id) => st(id).last).filter(Boolean).sort().pop();

  const groups = SUBJECTS.map((s) => {
    const ids = idsOf((t) => t.subject === s.key);
    const last = ids.map((id) => st(id).last).filter(Boolean).sort().pop();
    return { name: s.name, short: s.short, c: counts(ids), last };
  });
  const bioTc = BIO_TC.map((tc) => {
    const ids = idsOf((t) => t.tc === tc);
    return { name: tc, short: '', c: counts(ids), last: null };
  });

  return `
    <div class="pad">
      <h1 class="h1">Prehľad</h1>
      <div class="tally tally--wide">
        ${['V', 'C', 'N'].map((g) => `
          <div class="tally__item tally__item--${g}">
            <span class="tally__glyph" aria-hidden="true">${GLYPH[g]}</span>
            <b>${c[g]}</b><span>${GRADES[g]}</span>
          </div>`).join('')}
        <div class="tally__item tally__item--U">
          <span class="tally__glyph" aria-hidden="true">–</span>
          <b>${c.U}</b><span>Nehodnotené</span>
        </div>
      </div>

      <div class="est">
        <div><b>${p ? p.toFixed(1) : '0'}</b> ${plural(Math.round(p), 'téma', 'témy', 'tém')} denne
          <span class="muted">(priemer 14 dní)</span></div>
        <div>${weeks ? `Jedno kolo cez ${active.length} aktívnych tém trvá <b>${weeks < 1 ? 'menej ako týždeň' : Math.round(weeks) + ' ' + plural(Math.round(weeks), 'týždeň', 'týždne', 'týždňov')}</b>`
                     : 'Tempo sa spočíta po prvom kole.'}</div>
        <div class="muted">Naposledy hodnotené ${relDay(lastAll)}</div>
      </div>

      <div class="rowlabel">Podľa predmetu</div>
      ${groups.map(barRow).join('')}

      <div class="rowlabel">Biológia po tematických celkoch</div>
      ${bioTc.map(barRow).join('')}

      <div class="rowlabel">Témy na „viem“ v čase</div>
      <div class="chart" id="chart"></div>
    </div>`;
}

function barRow(g) {
  const { c } = g;
  const pct = (n) => (c.total ? (n / c.total) * 100 : 0);
  return `
    <div class="grp">
      <div class="grp__head">
        <span class="grp__name">${esc(g.name)}</span>
        ${g.last !== null ? `<span class="grp__last">${relDay(g.last)}</span>` : ''}
      </div>
      <div class="bar" role="img" aria-label="Viem ${c.V}, čiastočne ${c.C}, neviem ${c.N}, nehodnotené ${c.U}">
        ${['V', 'C', 'N'].map((k) => `<i class="bar__seg bar__seg--${k}" style="width:${pct(c[k])}%"></i>`).join('')}
        <i class="bar__seg bar__seg--U" style="width:${pct(c.U)}%"></i>
      </div>
      <div class="grp__nums">
        ${['V', 'C', 'N'].map((k) => `<span class="num num--${k}">${GLYPH[k]} ${c[k]}</span>`).join('')}
        <span class="num num--U">– ${c.U}</span>
        ${c.paused ? `<span class="num muted">pozastavené ${c.paused}</span>` : ''}
      </div>
    </div>`;
}

function drawChart() {
  const box = $('#chart');
  const pts = state.history.filter((e) => typeof e.v === 'number').slice(-120);
  if (!box) return;
  if (pts.length < 2) {
    box.innerHTML = '<p class="muted">Graf sa objaví po druhom dni hodnotenia.</p>';
    return;
  }
  const W = 600, H = 140, P = 8;
  const maxY = Math.max(TOPICS.length, ...pts.map((e) => e.v));
  const x = (i) => P + (i / (pts.length - 1)) * (W - 2 * P);
  const y = (v) => H - P - (v / maxY) * (H - 2 * P);
  const d = pts.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(e.v).toFixed(1)}`).join(' ');
  box.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Počet tém na viem v čase">
      <path d="${d} L${x(pts.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z" class="chart__fill"/>
      <path d="${d}" class="chart__line"/>
    </svg>
    <div class="chart__ax"><span>${esc(pts[0].d)}</span><span>${pts[pts.length - 1].v} / ${TOPICS.length}</span><span>${esc(pts[pts.length - 1].d)}</span></div>`;
}

/* ==================================================================
   C. VŠETKY TÉMY
================================================================== */
const filters = { subject: 'all', grade: 'all', q: '' };

function viewTopics() {
  const list = TOPICS.filter((t) => {
    if (filters.subject !== 'all' && t.subject !== filters.subject) return false;
    const s = st(t.id);
    if (filters.grade === 'U' && s.grade) return false;
    if (filters.grade === 'P' && !s.paused) return false;
    if (['V', 'C', 'N'].includes(filters.grade) && s.grade !== filters.grade) return false;
    if (filters.q && !titleOf(t.id).toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  });

  return `
    <div class="pad">
      <h1 class="h1">Všetky témy</h1>
      <input class="search" id="q" type="search" placeholder="Hľadať" value="${esc(filters.q)}" autocomplete="off">
      <div class="chips">
        ${[['all', 'Všetky'], ...SUBJECTS.map((s) => [s.key, s.short])]
          .map(([k, l]) => `<button class="chip${filters.subject === k ? ' is-on' : ''}" data-filter="subject" data-val="${k}">${esc(l)}</button>`).join('')}
      </div>
      <div class="chips">
        ${[['all', 'Všetky'], ['V', 'Viem'], ['C', 'Čiastočne'], ['N', 'Neviem'], ['U', 'Nehodnotené'], ['P', 'Pozastavené']]
          .map(([k, l]) => `<button class="chip${filters.grade === k ? ' is-on' : ''}" data-filter="grade" data-val="${k}">${esc(l)}</button>`).join('')}
      </div>
      <div class="count muted">${list.length} ${plural(list.length, 'téma', 'témy', 'tém')}</div>
      <ul class="list">${list.map(rowTopic).join('') || '<li class="muted pad">Nič nesedí na filter.</li>'}</ul>
    </div>`;
}

function rowTopic(t) {
  const s = st(t.id);
  return `
    <li class="row${s.paused ? ' row--paused' : ''}" data-open="${t.id}">
      <span class="row__mark row__mark--${s.grade || 'U'}" aria-hidden="true">${s.grade ? GLYPH[s.grade] : '–'}</span>
      <span class="row__body">
        <span class="row__title">${esc(titleOf(t.id))}</span>
        <span class="row__meta">${esc(SUBJ.get(t.subject).short)} ${t.num}${t.tc ? ' · ' + esc(t.tc) : ''}
          · ${s.count ? `${s.count}× · ${relDay(s.last)}` : 'nehodnotené'}${s.paused ? ' · pozastavená' : ''}</span>
        ${s.note ? `<span class="row__note">${esc(s.note)}</span>` : ''}
      </span>
    </li>`;
}

/* ---------- detail témy (sheet) ------------------------------------ */
function openSheet(id) {
  const t = CATALOG.get(id), s = st(id);
  const pos = state.queue.indexOf(id);
  const sheet = document.createElement('div');
  sheet.className = 'sheetwrap';
  sheet.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet__meta">${esc(SUBJ.get(t.subject).name)} · téma ${t.num}${t.tc ? ' · ' + esc(t.tc) : ''}</div>
      <input class="sheet__title" id="s-title" value="${esc(titleOf(id))}" aria-label="Názov témy">
      <input class="sheet__note" id="s-note" value="${esc(s.note)}" placeholder="Poznámka, jeden riadok" aria-label="Poznámka">
      <div class="answers answers--sm">
        ${['V', 'C', 'N'].map((g) => `
          <button class="ans ans--${g}${s.grade === g ? ' is-on' : ''}" data-sheet-grade="${g}">
            <span class="ans__glyph" aria-hidden="true">${GLYPH[g]}</span>
            <span class="ans__label">${GRADES[g]}</span>
          </button>`).join('')}
      </div>
      <div class="sheet__facts">
        <span>Hodnotená ${s.count}×</span><span>Naposledy ${fmtDate(s.last)}</span>
        <span>Vo fronte ${pos < 0 ? '—' : pos + 1}.</span>
      </div>
      <button class="ghost" data-sheet-pause>${s.paused ? 'Zaradiť späť do kola' : 'Pozastaviť tému'}</button>
      <button class="ghost" data-sheet-close>Zavrieť</button>
    </div>`;
  document.body.appendChild(sheet);

  const commit = () => {
    const nt = $('#s-title', sheet).value.trim();
    s.title = (!nt || nt === CATALOG.get(id).title) ? null : nt;
    s.note = $('#s-note', sheet).value.trim();
    save();
  };
  const close = () => { commit(); sheet.remove(); render(); };

  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-sheet-close]')) return close();
    const g = e.target.closest('[data-sheet-grade]');
    if (g) { commit(); grade(id, g.dataset.sheetGrade); sheet.remove(); render(); return; }
    if (e.target.closest('[data-sheet-pause]')) { s.paused = !s.paused; close(); }
  });
}

/* ==================================================================
   D. N-ZOZNAM
================================================================== */
function viewN() {
  const ids = nList();
  return `
    <div class="pad">
      <h1 class="h1">N-zoznam</h1>
      <p class="lede">Diery na štvrtkový blok. Téma zmizne, keď ju ohodnotíš na Č alebo V.</p>
      ${ids.length ? `<ul class="list">${ids.map((id) => {
        const t = CATALOG.get(id), d = daysBetween(st(id).nSince);
        return `
          <li class="row" data-open="${id}">
            <span class="row__mark row__mark--N" aria-hidden="true">${GLYPH.N}</span>
            <span class="row__body">
              <span class="row__title">${esc(titleOf(id))}</span>
              <span class="row__meta">${esc(SUBJ.get(t.subject).short)} ${t.num} · ${d === null ? '' : d === 0 ? 'od dnes' : `${d} ${plural(d, 'deň', 'dni', 'dní')} v N`}</span>
              ${st(id).note ? `<span class="row__note">${esc(st(id).note)}</span>` : ''}
            </span>
          </li>`;
      }).join('')}</ul>` : '<p class="muted">Žiadna téma nie je označená ako N.</p>'}
    </div>`;
}

/* ==================================================================
   E. SYSTÉM
================================================================== */
function viewSystem() {
  return `
    <div class="pad">
      <h1 class="h1">Systém</h1>

      <div class="rowlabel">Kolo</div>
      <div class="sizectl">
        <span>Tém na kolo</span>
        <div class="stepper">
          <button data-act="size-" aria-label="menej">−</button><b>${state.settings.roundSize}</b><button data-act="size+" aria-label="viac">+</button>
        </div>
      </div>
      <label class="toggle"><input type="checkbox" data-act="timer" ${state.settings.timer ? 'checked' : ''}><span>Časovač 90 sekúnd</span></label>

      <div class="rowlabel">Dáta</div>
      <div class="btnrow">
        <button class="ghost" data-act="export">Exportovať JSON</button>
        <button class="ghost" data-act="import">Importovať JSON</button>
      </div>
      <div class="btnrow">
        <button class="ghost" data-act="copy">Kopírovať do schránky</button>
        <button class="ghost" data-act="paste">Vložiť zo schránky</button>
      </div>
      <input type="file" id="file" accept="application/json,.json" hidden>
      <p class="muted small">Stav žije iba v tomto prehliadači. Prenos medzi telefónom a notebookom cez export/import.</p>

      <div class="rowlabel">Týždenný rozvrh</div>
      <div class="scrollx"><table class="tbl">
        <thead><tr><th></th><th>Ráno 45 min</th><th>V škole</th><th>Poobede</th></tr></thead>
        <tbody>
          <tr><th>Po</th><td>15' retrieval + 30' bio</td><td>ONT 1–2 + OBN 5 → samoštúdium občianska</td><td>45' bio konsolidácia</td></tr>
          <tr><th>Ut</th><td>15' retrieval + 30' angličtina</td><td>SEB bio → surové poznámky</td><td>šport</td></tr>
          <tr><th>St</th><td>15' retrieval + 30' bio</td><td>BIO → surové poznámky</td><td>45' bio konsolidácia</td></tr>
          <tr><th>Št</th><td>15' retrieval + 30' sloh</td><td>ONT 1–2 → samoštúdium občianska</td><td><b>90' flex — N-zoznam, testy, dobiehanie</b></td></tr>
          <tr><th>Pi</th><td>15' retrieval</td><td>BIO → surové · OBN 3 → samoštúdium</td><td>voľno</td></tr>
        </tbody>
      </table></div>
      <p class="muted small">Víkend: čítanie zo zoznamu literatúry, angličtina ako vstup (seriál bez titulkov, podcast).</p>

      <div class="rowlabel">Protokol samoštúdia na občianskej — 40 min = 1 téma</div>
      <ol class="steps">
        <li><b>5 min</b> — prečítaj len nadpisy v .docx, zavri, napíš spamäti čo vieš</li>
        <li><b>20 min</b> — čítaj .docx, dopĺňaj a opravuj priamo do toho, čo si napísal</li>
        <li><b>10 min</b> — zavri všetko, napíš záchytný bod: 5–7 odrážok vlastnými slovami</li>
        <li><b>5 min</b> — kontrola proti .docx, doplň, ohodnoť V/Č/N</li>
      </ol>
      <p class="muted small">Tempo 5 tém týždenne.</p>

      <div class="rowlabel">Šablóna bio poznámky</div>
      <p class="small">Dva zošity v Notability. <b>„BIO surové“</b> — počas hodiny, chronologicky, jedna strana na hodinu, kostra a schémy, značka <code>!</code> pri všetkom, čo učiteľka zdôrazní. <b>„BIO témy 1–60“</b> — jedna strana na tému, poobede prenosom zo surového.</p>
      <pre class="tpl">[číslo] — [názov témy]            (TC: [tematický celok])

Pojmy:            6–8 pojmov, každý jednou vetou
Schéma:           jedna kresba
Ako to funguje:   3–4 vety príčinnej reťaze
Čo sa ma môžu spýtať:  3 otázky</pre>
      <p class="muted small">Posledný blok je najdôležitejší — pri retrievale si zakry stranu, prečítaj tri otázky a odpovedz.</p>

      <div class="rowlabel">Fázy roka</div>
      <ul class="phases">
        <li><b>Sep–Dec</b> — občianska celá odbavená na hodinách. Bio zachytávanie beží. Retrieval kolo cez SJL. Jeden sloh a jeden didaktický test mesačne.</li>
        <li><b>Jan–Feb</b> — odpadá nemčina, uvoľnia sa 4 hodiny týždenne. Slohový šprint: jeden sloh týždenne, test každé dva týždne, chybník po každom.</li>
        <li><b>Marec</b> — týždeň pred písomkami plná simulácia v reálnom čase. Nič nové.</li>
        <li><b>Mar–Jún</b> — čistý retrieval, kolo sa zrýchľuje, N-témy dostávajú štvrtkové bloky.</li>
      </ul>

      <div class="rowlabel">Termíny</div>
      <ul class="phases">
        <li><b>9.–12. marca 2027</b> — písomné maturity zo SJL a ANJ</li>
        <li><b>koniec mája / začiatok júna 2027</b> — ústne maturity</li>
      </ul>

      <button class="ghost danger" data-act="reset">Vymazať všetok postup</button>
    </div>`;
}

/* ==================================================================
   EXPORT / IMPORT
================================================================== */
function exportBlob() {
  return JSON.stringify({ app: 'maturita', exported: nowISO(), state }, null, 2);
}
function doExport() {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([exportBlob()], { type: 'application/json' }));
  a.href = url;
  a.download = `maturita-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function applyImport(text) {
  let data;
  try { data = JSON.parse(text); } catch { return alert('Toto nie je platný JSON.'); }
  const incoming = data && data.state && data.state.topics ? data.state
                 : data && data.topics ? data : null;
  if (!incoming) return alert('V súbore nie je stav appky.');
  const n = Object.keys(incoming.topics).length;
  if (!confirm(`Nahradiť aktuálny postup importovaným (${n} tém)? Tento krok sa nedá vrátiť.`)) return;
  state = reconcile(incoming);
  logDay(0);
  save();
  render();
  alert('Stav načítaný.');
}

/* ==================================================================
   UDALOSTI
================================================================== */
document.addEventListener('click', (e) => {
  const ans = e.target.closest('[data-answer]');
  if (ans) return answer(ans.dataset.answer);

  const row = e.target.closest('[data-open]');
  if (row) return openSheet(row.dataset.open);

  const chip = e.target.closest('[data-filter]');
  if (chip) { filters[chip.dataset.filter] = chip.dataset.val; return render(); }

  const act = e.target.closest('[data-act]')?.dataset.act;
  if (!act) return;
  switch (act) {
    case 'start': startRound(); render(); break;
    case 'end': state.round = null; save(); render(); break;
    case 'size+': case 'size-':
      state.settings.roundSize = Math.min(10, Math.max(3,
        state.settings.roundSize + (act === 'size+' ? 1 : -1)));
      save(); render(); break;
    case 'timer':
      state.settings.timer = !state.settings.timer; save(); break;
    case 'export': doExport(); break;
    case 'import': $('#file').click(); break;
    case 'copy':
      navigator.clipboard.writeText(exportBlob())
        .then(() => alert('Stav je v schránke.'), () => alert('Schránka nie je dostupná — použi export do súboru.'));
      break;
    case 'paste': {
      const text = prompt('Vlož sem exportovaný JSON:');
      if (text) applyImport(text);
      break;
    }
    case 'reset':
      if (confirm('Vymazať všetky známky, poznámky a front?')) {
        state = reconcile(freshState()); save(); render();
      }
      break;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'file' && e.target.files[0]) {
    const fr = new FileReader();
    fr.onload = () => applyImport(fr.result);
    fr.readAsText(e.target.files[0]);
    e.target.value = '';
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'q') {
    filters.q = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const q = $('#q'); if (q) { q.focus(); q.setSelectionRange(pos, pos); }
  }
});

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (route() !== 'dnes' || !state.round) return;
  if (e.key === '1') { e.preventDefault(); answer('V'); }
  else if (e.key === '2') { e.preventDefault(); answer('C'); }
  else if (e.key === '3') { e.preventDefault(); answer('N'); }
  else if (e.key === ' ') { e.preventDefault(); toggleTimer(); }
});

document.addEventListener('animationend', (e) => {
  if (e.target.id === 'timerbar') { timer.done = true; timer.running = false; e.target.classList.add('done'); }
});

/* ---------- štart --------------------------------------------------- */
logDay(0);
save();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
