(() => {
  'use strict';

  const STORAGE_KEY = 'treino-casa-v1';
  const app = document.getElementById('app');

  // ---------- estado ----------

  const defaultState = () => ({ plan: 'ul4', sessions: [], drafts: {} });
  const DRAFT_TTL = 12 * 3600 * 1000; // treino não concluído é descartado após 12 h

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return { ...defaultState(), ...JSON.parse(raw) };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();
  // planos removidos (ex.: Full Body) → volta para o programa atual
  if (!PLANS[state.plan]) state.plan = 'ul4';
  // progresso em aberto fica guardado por treino (plano/dia), sem bloquear os outros
  if (state.draft) {
    state.drafts[`${state.draft.plan}/${state.draft.day}`] = state.draft;
    delete state.draft;
  }
  Object.entries(state.drafts).forEach(([key, d]) => {
    if (!findDayIn(d.plan, d.day) || Date.now() - new Date(d.started).getTime() > DRAFT_TTL) delete state.drafts[key];
  });
  let current = null; // rascunho do treino aberto na tela

  function findDayIn(planId, dayId) {
    return PLANS[planId] ? PLANS[planId].days.find((d) => d.id === dayId) : undefined;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // armazenamento indisponível (aba privada etc.) — o app continua funcionando na sessão
    }
  }

  // ---------- utilidades ----------

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

  const fmtRest = (s) => (s >= 60 ? `${Math.floor(s / 60)}${s % 60 ? `:${String(s % 60).padStart(2, '0')}` : ''} min` : `${s} s`);

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const plan = () => PLANS[state.plan] || PLANS.ul4;

  const findDay = findDayIn;

  const unitOf = (ex) => EXERCISES[ex].repsUnit || 'reps';

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // Última vez em que um exercício foi registrado (qualquer plano)
  function lastLog(exId) {
    for (let i = state.sessions.length - 1; i >= 0; i--) {
      const sets = state.sessions[i].entries[exId];
      if (sets && sets.some((s) => s.reps > 0)) return { date: state.sessions[i].date, sets: sets.filter((s) => s.reps > 0) };
    }
    return null;
  }

  // Dupla progressão: topo da faixa em todas as séries → subir carga
  function suggestion(item) {
    const ex = EXERCISES[item.ex];
    const [min, max] = item.reps;
    const last = lastLog(item.ex);
    const unit = unitOf(item.ex);
    if (!last) {
      return {
        cls: '',
        html: `<strong>Primeira vez:</strong> escolha uma carga em que você termine entre ${min} e ${max} ${unit} deixando ${item.rir} na reserva.`,
      };
    }
    const summary = last.sets.map((s) => (s.kg ? `${fmtNum(s.kg)} kg × ${s.reps}` : `${s.reps}`)).join(' · ');
    const allTop = last.sets.length >= item.sets && last.sets.every((s) => s.reps >= max);
    const anyLow = last.sets.some((s) => s.reps < min);
    let tip;
    let cls = '';
    if (allTop) {
      cls = 'up';
      tip = `<strong>Hora de progredir ↑</strong> Suba a carga. Sem halter mais pesado? Desça em 3 s com pausa, ou tente: ${esc(ex.harder)}.`;
    } else if (anyLow) {
      tip = `<strong>Abaixo da faixa.</strong> Mantenha ou reduza a carga para ficar entre ${min} e ${max}.`;
    } else {
      tip = `<strong>Meta:</strong> mesma carga, +1 rep em pelo menos uma série.`;
    }
    return { cls, html: `<span class="muted">Última vez (${fmtDate(last.date)}): ${summary}</span><br>${tip}` };
  }

  // Volume semanal fracionado por músculo
  function weeklyVolume(p) {
    const vol = Object.fromEntries(Object.keys(MUSCLES).map((m) => [m, 0]));
    p.days.forEach((d) =>
      d.items.forEach((it) => {
        Object.entries(EXERCISES[it.ex].muscles).forEach(([m, w]) => (vol[m] += it.sets * w));
      })
    );
    return vol;
  }

  function nextDay() {
    const p = plan();
    const last = [...state.sessions].reverse().find((s) => s.plan === state.plan);
    if (!last) return p.days[0];
    const idx = p.days.findIndex((d) => d.id === last.day);
    return p.days[(idx + 1) % p.days.length];
  }

  function sessionsThisWeek() {
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return state.sessions.filter((s) => new Date(s.date) >= monday).length;
  }

  function streakWeeks() {
    // semanas consecutivas (incluindo a atual ou a anterior) com pelo menos 2 treinos
    const weekKey = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
      return x.getTime();
    };
    const counts = {};
    state.sessions.forEach((s) => {
      const k = weekKey(s.date);
      counts[k] = (counts[k] || 0) + 1;
    });
    const WEEK = 7 * 24 * 3600 * 1000;
    let k = weekKey(new Date());
    if (!(counts[k] >= 2)) k -= WEEK;
    let n = 0;
    while (counts[k] >= 2) {
      n++;
      k -= WEEK;
    }
    return n;
  }

  // ---------- views ----------

  function viewHome() {
    const p = plan();
    const next = nextDay();
    const total = state.sessions.length;

    return `
      <div class="stack-lg">
        <div class="stack">
          <section class="hero stack">
            <div class="row between">
              <div>
                <div class="eyebrow">Próximo treino</div>
                <h1>${esc(next.name)}</h1>
                <p class="muted">${esc(next.focus)}</p>
              </div>
              <div class="day-letter" aria-hidden="true">${esc(next.id)}</div>
            </div>
            <p class="small muted">${next.items.length} exercícios · ${next.items.reduce((a, i) => a + i.sets, 0)} séries · ${esc(p.duration)}</p>
            <a class="btn primary block" href="#treino/${state.plan}/${next.id}">Começar treino</a>
          </section>
        </div>

        <div class="stats">
          <div class="stat"><b>${sessionsThisWeek()}</b><span class="small muted">treinos nesta semana</span></div>
          <div class="stat"><b>${streakWeeks()}</b><span class="small muted">semanas seguidas</span></div>
          <div class="stat"><b>${total}</b><span class="small muted">treinos no total</span></div>
        </div>

        <section class="stack">
          <div>
            <h2>${esc(p.name)}</h2>
            <span class="small muted">${esc(p.schedule)}</span>
          </div>
          <div class="day-list">
            ${p.days
              .map(
                (d) => `
              <a class="day-item ${d.id === next.id ? 'next' : ''}" href="#treino/${state.plan}/${d.id}">
                <span class="badge">${esc(d.id)}</span>
                <span class="grow">
                  <b>${esc(d.name)}</b><br>
                  <span class="small muted">${esc(d.focus)}</span>
                </span>
                <span class="chev" aria-hidden="true">›</span>
              </a>`
              )
              .join('')}
          </div>
        </section>

        <section class="card stack">
          <h3>Regras de ouro</h3>
          <ol class="steps small">
            <li><b>Chegue perto da falha:</b> termine cada série com 0–2 reps na reserva.</li>
            <li><b>Progrida sempre:</b> bateu o topo da faixa em todas as séries? Suba carga ou dificuldade.</li>
            <li><b>Amplitude completa,</b> com ênfase na parte alongada do movimento.</li>
            <li><b>Consistência > perfeição:</b> 3 treinos por semana por meses vencem qualquer rotina "ideal" abandonada.</li>
          </ol>
        </section>
      </div>`;
  }

  function ensureDraft(planId, dayId) {
    const key = `${planId}/${dayId}`;
    const d = state.drafts[key];
    if (d && Date.now() - new Date(d.started).getTime() <= DRAFT_TTL) return d;
    const day = findDay(planId, dayId);
    state.drafts[key] = {
      plan: planId,
      day: dayId,
      started: new Date().toISOString(),
      entries: Object.fromEntries(
        day.items.map((it, i) => {
          const last = lastLog(it.ex);
          const kg = last ? last.sets[last.sets.length - 1].kg || '' : '';
          return [it.ex + '|' + i,Array.from({ length: it.sets }, () => ({ kg, reps: '', done: false }))];
        })
      ),
    };
    save();
    return state.drafts[key];
  }

  function viewWorkout(planId, dayId) {
    const day = findDay(planId, dayId);
    if (!day) return viewNotFound();

    const draft = (current = ensureDraft(planId, dayId));
    const totalSets = day.items.reduce((a, i) => a + i.sets, 0);
    const doneSets = Object.values(draft.entries).flat().filter((s) => s.done).length;
    const firstEx = EXERCISES[day.items[0].ex].name;

    return `
      <div class="stack">
        <div class="workout-head">
          <a href="#hoje" class="small muted" style="text-decoration:none">‹ Voltar</a>
          <div class="eyebrow">${esc(PLANS[planId].name)}</div>
          <h1>${esc(day.name)}</h1>
          <p class="muted">${esc(day.focus)}</p>
          <div class="progress" aria-label="Progresso do treino"><div id="wprogress" style="width:${(doneSets / totalSets) * 100}%"></div></div>
          <p class="small muted" id="wcount">${doneSets} de ${totalSets} séries</p>
        </div>

        <details class="card warmup">
          <summary><b>Aquecimento (5–7 min)</b></summary>
          <ol class="small" style="margin:10px 0 0;padding-left:18px">
            <li>2–3 min de polichinelos, corrida parada ou pular corda.</li>
            <li>10 agachamentos livres, 10 rotações de ombro, 10 "bom dia" sem peso.</li>
            <li>1–2 séries leves de <b>${esc(firstEx)}</b> (~50% da carga, 6–8 reps).</li>
          </ol>
        </details>

        ${day.items.map((it, i) => exerciseCard(it, i, draft)).join('')}

        <button class="btn primary block" type="button" data-action="finish">Concluir treino</button>
        <button class="btn block danger" type="button" data-action="discard-draft" data-go="#hoje">Descartar treino</button>
      </div>`;
  }

  function exerciseCard(item, index, draft) {
    const ex = EXERCISES[item.ex];
    const key = item.ex + '|' + index;
    const sets = draft.entries[key] || [];
    const unit = unitOf(item.ex);
    const sug = suggestion(item);
    const muscles = Object.entries(ex.muscles)
      .sort((a, b) => b[1] - a[1])
      .map(([m, w]) => `<span class="chip ${w === 1 ? 'main' : ''}">${MUSCLES[m]}</span>`)
      .join('');
    const allDone = sets.length && sets.every((s) => s.done);
    const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.name + ' halter execução');
    const media = ex.img
      ? `<button type="button" class="demo" data-action="zoom" aria-expanded="false" aria-label="Ampliar imagem de ${esc(ex.name)}">
          <img src="${IMG_BASE}${ex.img}/0.jpg" alt="${esc(ex.name)}: posição inicial" loading="lazy" width="850" height="567">
          <img src="${IMG_BASE}${ex.img}/1.jpg" alt="${esc(ex.name)}: posição final" loading="lazy" width="850" height="567">
        </button>`
      : '';

    return `
      <article class="card ex ${allDone ? 'done' : ''}" data-key="${esc(key)}" data-rest="${item.rest}">
        <div class="ex-head">
          <div class="ex-title">
            ${media}
            <div>
              <div class="ex-num">${index + 1} / ${findDay(draft.plan, draft.day).items.length}</div>
              <h3>${esc(ex.name)}</h3>
              <div class="chips">${muscles}</div>
            </div>
          </div>
          ${ex.imgNote ? `<p class="small muted img-note">${esc(ex.imgNote)}</p>` : ''}
          <div class="target">
            <span><b>${item.sets}</b> × <b>${item.reps[0]}–${item.reps[1]}</b> ${unit}${ex.unilateral ? ' /lado' : ''}</span>
            <span>RIR <b>${esc(item.rir)}</b></span>
            <span>Descanso <b>${fmtRest(item.rest)}</b></span>
          </div>
        </div>
        <div class="hint ${sug.cls}">${sug.html}</div>
        <details class="how">
          <summary>Como fazer</summary>
          <ul class="small">${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          <p class="small"><b>Mais fácil:</b> ${esc(ex.easier)}<br><b>Mais difícil:</b> ${esc(ex.harder)}</p>
          <p class="small" style="margin-top:6px"><a href="${yt}" target="_blank" rel="noopener">▶ Ver vídeos da execução no YouTube ↗</a></p>
        </details>
        <div class="sets">
          <div class="set-head"><span></span><span>kg</span><span>${unit}</span><span></span></div>
          ${sets
            .map(
              (s, si) => `
            <div class="set-row ${s.done ? 'checked' : ''}" data-set="${si}">
              <span class="n">${si + 1}</span>
              <input type="number" inputmode="decimal" min="0" step="0.5" aria-label="Carga série ${si + 1}" data-field="kg" value="${esc(s.kg)}" placeholder="—">
              <input type="number" inputmode="numeric" min="0" step="1" aria-label="${unit} série ${si + 1}" data-field="reps" value="${esc(s.reps)}" placeholder="${item.reps[0]}–${item.reps[1]}">
              <button type="button" class="set-check" data-action="check" aria-pressed="${s.done}" aria-label="Marcar série ${si + 1} como feita">
                <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
              </button>
            </div>`
            )
            .join('')}
        </div>
        <div class="ex-foot">
          <button type="button" class="linkbtn" data-action="add-set">+ Série</button>
          ${sets.length > 1 ? '<button type="button" class="linkbtn" data-action="remove-set">− Remover série</button>' : ''}
        </div>
      </article>`;
  }

  function viewProgram() {
    const cards = Object.entries(PLANS)
      .map(([id, p]) => {
        const vol = weeklyVolume(p);
        const active = id === state.plan;
        return `
        <section class="card plan-card ${active ? 'active' : ''}">
          <div class="row between wrap">
            <div>
              <span class="tag">${esc(p.tag)}</span>
              <h2>${esc(p.name)}</h2>
            </div>
          </div>
          <p>${esc(p.description)}</p>
          <p class="small muted">${esc(p.schedule)} · ${esc(p.duration)}</p>

          <details>
            <summary class="small" style="cursor:pointer;font-weight:600;color:var(--accent)">Ver treinos</summary>
            ${p.days
              .map(
                (d) => `
              <h3 style="margin-top:14px">${esc(d.name)} <span class="small muted" style="font-family:var(--font-body)">${esc(d.focus)}</span></h3>
              <table class="plan">
                ${d.items
                  .map(
                    (it) =>
                      `<tr><td>${EXERCISES[it.ex].img ? `<img class="thumb" src="${IMG_BASE}${EXERCISES[it.ex].img}/1.jpg" alt="" loading="lazy">` : ''}${esc(EXERCISES[it.ex].name)}</td><td>${it.sets} × ${it.reps[0]}–${it.reps[1]}${EXERCISES[it.ex].repsUnit === 's' ? ' s' : ''}</td></tr>`
                  )
                  .join('')}
              </table>`
              )
              .join('')}
          </details>

          <div class="stack" style="margin-top:6px">
            <div class="eyebrow">Séries por semana por músculo</div>
            <div class="vol">${volumeBars(vol)}</div>
            <div class="legend">
              <span><i style="background:var(--accent)"></i>Séries (fracionadas)</span>
              <span><i style="background:var(--accent-soft);border:1px dashed var(--accent)"></i>Faixa de referência 10–20</span>
            </div>
          </div>
        </section>`;
      })
      .join('');

    return `
      <div class="stack-lg">
        <div class="stack">
          <h1>Programa</h1>
          <p class="muted">Programa montado só com 2 halteres, sem banco nem barra fixa. Um sofá, uma cadeira e um degrau ajudam.</p>
        </div>

        ${cards}

        <section class="card stack">
          <h2>Como progredir</h2>
          <ol class="steps">
            <li><b>Dupla progressão.</b> Cada exercício tem uma faixa (ex.: 8–15). Mantenha a carga até conseguir o topo da faixa em todas as séries. Aí suba o peso e recomece embaixo.</li>
            <li><b>Halteres fixos? Suba as reps.</b> Até ~25–30 reps ainda gera hipertrofia se a série for perto da falha.</li>
            <li><b>Depois, aumente a dificuldade</b> sem mudar a carga: descida em 3 s, pausa de 1–2 s na parte alongada, versão unilateral, ou as variações "mais difícil".</li>
            <li><b>Registre tudo.</b> O app mostra o que você fez da última vez e diz quando progredir.</li>
          </ol>
        </section>

        <section class="card stack">
          <h2>Organização em blocos</h2>
          <table class="plan">
            <tr><td><b>Semanas 1–2</b><br><span class="small muted">Aprender os movimentos, achar as cargas</span></td><td>RIR 2–3</td></tr>
            <tr><td><b>Semanas 3–8</b><br><span class="small muted">Progressão ativa, última série dos isolados até a falha</span></td><td>RIR 0–2</td></tr>
            <tr><td><b>Semana 9 (opcional)</b><br><span class="small muted">Deload: metade das séries, se estiver cansado ou com dores</span></td><td>RIR 3–4</td></tr>
          </table>
          <p class="small muted">A evidência sobre deloads programados é limitada; use quando o desempenho cair por 2 treinos seguidos ou as articulações pedirem.</p>
        </section>

        <section class="card stack">
          <h2>Quando comprar mais peso</h2>
          <p>Se você passa de 25–30 reps na maioria dos exercícios de pernas e costas mesmo com as variações difíceis, halteres ajustáveis são o melhor investimento. Até lá, dá para evoluir bastante.</p>
        </section>
      </div>`;
  }

  function volumeBars(vol) {
    const max = 25;
    return Object.entries(vol)
      .map(
        ([m, v]) => `
      <div class="vol-row">
        <span>${MUSCLES[m]}</span>
        <div class="vol-track" role="img" aria-label="${MUSCLES[m]}: ${fmtNum(v)} séries por semana">
          <div class="vol-band" style="left:${(10 / max) * 100}%;width:${(10 / max) * 100}%"></div>
          <div class="vol-fill" style="width:${Math.min(v / max, 1) * 100}%"></div>
        </div>
        <b>${fmtNum(v)}</b>
      </div>`
      )
      .join('');
  }

  function viewScience() {
    const refLink = (id) => {
      const text = REFERENCES[id];
      const title = text.split('. ').slice(1, 2).join('');
      return `<li><a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}" target="_blank" rel="noopener">${esc(text)}</a></li>`;
    };
    return `
      <div class="stack-lg">
        <div class="stack">
          <h1>A ciência</h1>
          <p class="muted">Os princípios que sustentam o programa, com as meta-análises e estudos por trás de cada um. Toque numa referência para buscá-la no PubMed.</p>
        </div>
        ${PRINCIPLES.map(
          (p, i) => `
          <section class="card principle">
            <div class="eyebrow">Princípio ${i + 1}</div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.body)}</p>
            <ul class="refs">${p.refs.map(refLink).join('')}</ul>
          </section>`
        ).join('')}
        <section class="card stack">
          <h3>O que NÃO importa tanto quanto parece</h3>
          <ul class="small" style="margin:0;padding-left:18px">
            <li>"Confundir o músculo" trocando de treino toda semana — repetir os mesmos exercícios permite medir e progredir.</li>
            <li>Janela anabólica de 30 min — o total de proteína no dia (~1,6 g/kg) importa muito mais.</li>
            <li>Divisão por grupo muscular vs. full body — com o mesmo volume, os resultados são parecidos.</li>
          </ul>
        </section>
        <p class="small muted">Este site é educativo e não substitui orientação de um profissional de educação física ou médico. Se tiver lesões, dores ou condições de saúde, consulte um profissional antes de começar.</p>
      </div>`;
  }

  function viewHistory() {
    const sessions = [...state.sessions].reverse();
    const list = sessions.length
      ? sessions
          .map((s) => {
            const day = findDay(s.plan, s.day);
            const rows = Object.entries(s.entries)
              .filter(([, sets]) => sets.some((x) => x.reps > 0))
              .map(
                ([ex, sets]) =>
                  `<tr><td>${esc(EXERCISES[ex]?.name || ex)}</td><td>${sets
                    .filter((x) => x.reps > 0)
                    .map((x) => (x.kg ? `${fmtNum(x.kg)}×${x.reps}` : x.reps))
                    .join(' · ')}</td></tr>`
              )
              .join('');
            const vol = Object.values(s.entries)
              .flat()
              .reduce((a, x) => a + (x.kg || 0) * (x.reps || 0), 0);
            return `
            <details class="card session">
              <summary class="row between">
                <span><b>${esc(day?.name || s.day)}</b><br><span class="small muted">${fmtDate(s.date)} · ${s.minutes || '?'} min</span></span>
                <span class="small muted">${vol ? `${Math.round(vol).toLocaleString('pt-BR')} kg` : ''}</span>
              </summary>
              <table>${rows}</table>
              <button class="linkbtn" type="button" data-action="delete-session" data-id="${esc(s.id)}" style="color:var(--danger)">Excluir este treino</button>
            </details>`;
          })
          .join('')
      : `<div class="empty card">Nenhum treino registrado ainda.<br><a href="#hoje">Começar o primeiro →</a></div>`;

    return `
      <div class="stack-lg">
        <div class="stack">
          <h1>Histórico</h1>
          <p class="muted">Seus dados ficam salvos só neste navegador. Faça backup de vez em quando.</p>
          <div class="row wrap">
            <button class="btn sm" type="button" data-action="export">Exportar backup</button>
            <label class="btn sm">Importar backup<input type="file" accept="application/json" data-action="import" hidden></label>
          </div>
        </div>
        ${exerciseProgress()}
        <div class="stack">${list}</div>
      </div>`;
  }

  // Melhor série (maior kg×reps) por exercício: primeira vs. mais recente
  function exerciseProgress() {
    const map = {};
    state.sessions.forEach((s) => {
      Object.entries(s.entries).forEach(([ex, sets]) => {
        const valid = sets.filter((x) => x.reps > 0);
        if (!valid.length) return;
        const best = valid.reduce((a, b) => ((b.kg || 1) * b.reps > (a.kg || 1) * a.reps ? b : a));
        map[ex] = map[ex] || { first: best, last: best, n: 0 };
        map[ex].last = best;
        map[ex].n++;
      });
    });
    const rows = Object.entries(map).filter(([, v]) => v.n >= 2);
    if (!rows.length) return '';
    const fmt = (x) => (x.kg ? `${fmtNum(x.kg)} kg × ${x.reps}` : `${x.reps}`);
    return `
      <section class="card stack">
        <h3>Evolução (melhor série)</h3>
        <table class="plan">
          ${rows
            .map(
              ([ex, v]) =>
                `<tr><td>${esc(EXERCISES[ex]?.name || ex)}<br><span class="small muted">${fmt(v.first)} → <b style="color:var(--text)">${fmt(v.last)}</b></span></td><td>${v.n} treinos</td></tr>`
            )
            .join('')}
        </table>
      </section>`;
  }

  function viewNotFound() {
    return `<div class="empty card">Página não encontrada. <a href="#hoje">Voltar ao início</a></div>`;
  }

  // ---------- roteamento ----------

  function route() {
    const hash = location.hash.replace(/^#/, '') || 'hoje';
    const [page, a, b] = hash.split('/');
    const tab = page === 'treino' ? 'hoje' : page;

    document.querySelectorAll('.tabbar a').forEach((el) => {
      if (el.dataset.tab === tab) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });

    const views = {
      hoje: viewHome,
      treino: () => viewWorkout(a, b),
      programa: viewProgram,
      ciencia: viewScience,
      historico: viewHistory,
    };
    current = null;
    app.innerHTML = (views[page] || viewNotFound)();
    if (page === 'treino') requestWakeLock();
    else releaseWakeLock();
  }

  function rerender() {
    const y = window.scrollY;
    route();
    window.scrollTo(0, y);
  }

  window.addEventListener('hashchange', () => {
    route();
    window.scrollTo(0, 0);
  });

  // ---------- interações ----------

  function updateWorkoutProgress() {
    const d = current;
    if (!d) return;
    const all = Object.values(d.entries).flat();
    const done = all.filter((s) => s.done).length;
    const bar = document.getElementById('wprogress');
    const count = document.getElementById('wcount');
    if (bar) bar.style.width = `${(done / all.length) * 100}%`;
    if (count) count.textContent = `${done} de ${all.length} séries`;
  }

  app.addEventListener('input', (e) => {
    const input = e.target;
    const field = input.dataset.field;
    if (!field || !current) return;
    const card = input.closest('.ex');
    const setIdx = +input.closest('.set-row').dataset.set;
    const set = current.entries[card.dataset.key][setIdx];
    set[field] = input.value === '' ? '' : Number(input.value);
    // carga digitada na série vale para as próximas séries ainda não feitas
    if (field === 'kg') {
      const sets = current.entries[card.dataset.key];
      sets.slice(setIdx + 1).forEach((s, i) => {
        if (s.done) return;
        s.kg = set.kg;
        const el = card.querySelector(`[data-set="${setIdx + 1 + i}"] [data-field="kg"]`);
        if (el) el.value = set.kg;
      });
    }
    save();
  });

  app.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'import') importBackup(e.target.files[0]);
  });

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action], [data-plan]');
    if (!btn) return;

    if (btn.dataset.plan) {
      state.plan = btn.dataset.plan;
      save();
      rerender();
      return;
    }

    const action = btn.dataset.action;
    const card = btn.closest('.ex');

    if (action === 'check') {
      const row = btn.closest('.set-row');
      const set = current.entries[card.dataset.key][+row.dataset.set];
      // se não digitou reps, assume o mínimo da faixa sugerido no placeholder
      const repsInput = row.querySelector('[data-field="reps"]');
      if (!set.done && set.reps === '') {
        const min = parseInt(repsInput.placeholder, 10);
        if (!Number.isNaN(min)) {
          set.reps = min;
          repsInput.value = min;
        }
      }
      set.done = !set.done;
      row.classList.toggle('checked', set.done);
      btn.setAttribute('aria-pressed', set.done);
      const sets = current.entries[card.dataset.key];
      card.classList.toggle('done', sets.every((s) => s.done));
      save();
      updateWorkoutProgress();
      if (set.done) startTimer(+card.dataset.rest);
      return;
    }

    if (action === 'add-set' || action === 'remove-set') {
      const sets = current.entries[card.dataset.key];
      if (action === 'add-set') {
        const prev = sets[sets.length - 1];
        sets.push({ kg: prev ? prev.kg : '', reps: '', done: false });
      } else if (sets.length > 1) {
        sets.pop();
      }
      save();
      rerender();
      return;
    }

    if (action === 'zoom') {
      const open = card.classList.toggle('zoomed');
      btn.setAttribute('aria-expanded', open);
      return;
    }

    if (action === 'finish') return finishWorkout();

    if (action === 'discard-draft') {
      if (!confirm('Descartar este treino? Os registros dele serão perdidos.')) return;
      delete state.drafts[`${current.plan}/${current.day}`];
      current = null;
      save();
      stopTimer();
      if (location.hash === btn.dataset.go) rerender();
      else location.hash = btn.dataset.go;
      return;
    }

    if (action === 'delete-session') {
      if (!confirm('Excluir este treino do histórico?')) return;
      state.sessions = state.sessions.filter((s) => s.id !== btn.dataset.id);
      save();
      rerender();
      return;
    }

    if (action === 'export') return exportBackup();
  });

  function finishWorkout() {
    const d = current;
    const entries = {};
    Object.entries(d.entries).forEach(([key, sets]) => {
      const ex = key.split('|')[0];
      const logged = sets
        .filter((s) => s.done || s.reps !== '')
        .map((s) => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 }))
        .filter((s) => s.reps > 0);
      if (logged.length) entries[ex] = (entries[ex] || []).concat(logged);
    });

    if (!Object.keys(entries).length) {
      if (!confirm('Nenhuma série registrada. Concluir mesmo assim?')) return;
    }

    const minutes = Math.max(1, Math.round((Date.now() - new Date(d.started).getTime()) / 60000));
    state.sessions.push({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      plan: d.plan,
      day: d.day,
      minutes: minutes > 240 ? null : minutes,
      entries,
    });
    delete state.drafts[`${d.plan}/${d.day}`];
    current = null;
    save();
    stopTimer();
    toast('Treino salvo! 💪');
    location.hash = '#hoje';
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ app: 'treino-casa', version: 1, ...state }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `treino-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.sessions)) throw new Error('formato');
        if (!confirm(`Importar ${data.sessions.length} treinos? Isso substitui o histórico atual.`)) return;
        state = { ...defaultState(), plan: PLANS[data.plan] ? data.plan : 'ul4', sessions: data.sessions };
        save();
        toast('Backup importado');
        rerender();
      } catch {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  }

  // ---------- cronômetro de descanso ----------

  const timerEl = document.getElementById('timer');
  const timerTime = document.getElementById('timer-time');
  const timerProgress = document.getElementById('timer-progress');
  let timer = null;

  function startTimer(seconds) {
    stopTimer();
    timer = { end: Date.now() + seconds * 1000, total: seconds * 1000, raf: 0, beeped: false };
    timerEl.hidden = false;
    timerEl.classList.remove('finished');
    unlockAudio();
    tick();
  }

  function tick() {
    if (!timer) return;
    const left = timer.end - Date.now();
    const secs = Math.max(0, Math.ceil(left / 1000));
    timerTime.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    timerProgress.style.width = `${Math.max(0, left / timer.total) * 100}%`;
    if (left <= 0 && !timer.beeped) {
      timer.beeped = true;
      timerEl.classList.add('finished');
      beep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => timer && timer.beeped && stopTimer(), 4000);
      return;
    }
    timer.raf = setTimeout(tick, 250);
  }

  function stopTimer() {
    if (timer) clearTimeout(timer.raf);
    timer = null;
    timerEl.hidden = true;
  }

  timerEl.addEventListener('click', (e) => {
    const act = e.target.closest('[data-timer]')?.dataset.timer;
    if (!act || !timer) return;
    if (act === 'skip') stopTimer();
    if (act === 'add') {
      timer.end += 15000;
      timer.total += 15000;
    }
  });

  let audioCtx = null;
  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch {
      audioCtx = null;
    }
  }

  function beep() {
    if (!audioCtx) return;
    [0, 0.25, 0.5].forEach((t) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t);
      o.stop(audioCtx.currentTime + t + 0.2);
    });
  }

  // mantém a tela acesa durante o treino (quando suportado)
  let wakeLock = null;
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => (wakeLock = null));
      }
    } catch {
      wakeLock = null;
    }
  }
  function releaseWakeLock() {
    if (wakeLock) wakeLock.release().catch(() => {});
    wakeLock = null;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && location.hash.startsWith('#treino')) requestWakeLock();
  });

  route();
})();
