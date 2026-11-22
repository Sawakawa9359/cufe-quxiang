/* 渲染逻辑：纯 SVG，无外部依赖 */
(function () {
  const D = window.DATA;
  const TEAL = "#0f7a66", GOLD = "#b8852f", RED = "#a8322c", BLUE = "#2b5d8a";
  const DIM = "#b9cdc8", LINE = "#e6efec", INK = "#1b2f2a", SUB = "#5f7370";
  const PALETTE = ["#0f7a66", "#3f9d88", "#7cbfae", "#b8852f", "#2b5d8a",
                   "#8aa9c4", "#a8322c", "#d08a72", "#6b8f5e", "#9b8fc4",
                   "#c9a227", "#7a8a86"];

  const el = (id) => document.getElementById(id);
  const svg = (w, h, body) =>
    `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const txt = (x, y, s, o = {}) =>
    `<text x="${x}" y="${y}" fill="${o.fill || SUB}" font-size="${o.size || 11}" ` +
    `text-anchor="${o.anchor || "start"}" ${o.weight ? `font-weight="${o.weight}"` : ""}` +
    `${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ""}>${s}</text>`;

  /* ---------- 1. KPI ---------- */
  function renderKpis() {
    el("kpiBox").innerHTML = D.kpi.map(k => `
      <div class="kpi ${k.cls}">
        <div class="n">${k.n}<small>${k.u}</small></div>
        <div class="l">${k.l}</div>
        <div class="d">${k.d}</div>
      </div>`).join("");
  }

  /* ---------- 2. 行业折线图 ---------- */
  function renderLine() {
    const W = 940, H = 380, L = 46, R = 16, T = 16, B = 46;
    const iw = W - L - R, ih = H - T - B;
    const yMax = 16, yStep = 4;
    let g = "";
    // 网格
    for (let v = 0; v <= yMax; v += yStep) {
      const y = T + ih - (v / yMax) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 8, y + 4, v + "%", { anchor: "end", size: 10.5 });
    }
    // x 轴
    D.years.forEach((yr, i) => {
      const x = L + (i / (D.years.length - 1)) * iw;
      g += `<line x1="${x}" y1="${T}" x2="${x}" y2="${T + ih}" stroke="${LINE}" stroke-dasharray="2 4"/>`;
      g += txt(x, H - B + 18, yr + " 届", { anchor: "middle", size: 10.5 });
    });
    // 线
    D.industries.forEach((ind, k) => {
      const pts = ind.v.map((v, i) => {
        const x = L + (i / (D.years.length - 1)) * iw;
        const y = T + ih - (v / yMax) * ih;
        return [x, y];
      });
      const dPath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const color = ind.key ? RED : (ind.warn ? GOLD : PALETTE[k % PALETTE.length]);
      const w = ind.key || ind.warn ? 3 : 1.6;
      const op = ind.key || ind.warn ? 1 : 0.55;
      g += `<path d="${dPath}" fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linejoin="round"/>`;
      if (ind.key || ind.warn) {
        pts.forEach((p, i) => {
          g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.6" fill="#fff" stroke="${color}" stroke-width="2"/>`;
          if (i === pts.length - 1) {
            g += txt(p[0] - 6, p[1] - 10, ind.v[i].toFixed(1) + "%",
                     { anchor: "end", size: 11, fill: color, weight: 700 });
          }
        });
      }
    });
    el("chLine").innerHTML = svg(W, H, g);

    // 图例（可点击高亮：这里只做静态图例，点击滚动到表格）
    el("lgLine").innerHTML = D.industries.map((ind, k) => {
      const color = ind.key ? RED : (ind.warn ? GOLD : PALETTE[k % PALETTE.length]);
      return `<span style="cursor:default"><i style="background:${color}"></i>${ind.name}
        <b style="color:${ind.chg > 0 ? TEAL : (ind.chg < 0 ? RED : SUB)}">${ind.chg > 0 ? "+" : ""}${ind.chg}</b></span>`;
    }).join("");
  }

  /* ---------- 3. 行业条形图（2025 占比 + 变化） ---------- */
  function renderBar() {
    const rows = D.industries.slice().sort((a, b) => b.v[4] - a.v[4]);
    const rowH = 30, W = 940, L = 250, R = 150, T = 8;
    const H = T + rows.length * rowH + 26;
    const maxV = 15, iw = W - L - R;
    let g = "";
    rows.forEach((ind, i) => {
      const y = T + i * rowH;
      const by = y + 6, bh = 16;
      const w = (ind.v[4] / maxV) * iw;
      const color = ind.key ? RED : (ind.warn ? GOLD : "#5aa693");
      g += txt(L - 10, by + 12, ind.name.length > 13 ? ind.name.slice(0, 13) + "…" : ind.name,
               { anchor: "end", size: 11, fill: ind.key || ind.warn ? INK : SUB,
                 weight: ind.key || ind.warn ? 700 : 400 });
      if (ind.key || ind.warn) {
        g += `<rect x="${L}" y="${by}" width="${iw}" height="${bh}" fill="#f6f9f8" rx="3"/>`;
      }
      g += `<rect x="${L}" y="${by}" width="${w.toFixed(1)}" height="${bh}" fill="${color}" rx="3"
              opacity="${ind.key || ind.warn ? 0.95 : 0.72}"/>`;
      g += txt(L + w + 8, by + 12, ind.v[4].toFixed(1) + "%",
               { size: 11, fill: INK, weight: 700 });
      const up = ind.chg > 0;
      g += txt(W - R + 40, by + 12,
               (up ? "▲ +" : (ind.chg === 0 ? "— " : "▼ ")) + ind.chg.toFixed(1),
               { size: 11, fill: up ? TEAL : (ind.chg === 0 ? SUB : RED), weight: 600, anchor: "start" });
    });
    g += txt(L - 10, H - 8, "2025 届就业占比", { anchor: "end", size: 10.5, fill: SUB });
    g += txt(W - R + 40, H - 8, "较 2021 届（pct）", { size: 10.5, fill: SUB });
    el("chBar").innerHTML = svg(W, H, g);
  }

  /* ---------- 3b. 单行业迷你折线（总览页） ---------- */
  function renderMini(ind, targetId, color) {
    const W = 440, H = 196, L = 40, R = 18, T = 18, B = 34;
    const iw = W - L - R, ih = H - T - B;
    const vals = ind.v;
    const lo = Math.floor(Math.min(...vals) * 2) / 2 - 0.5;
    const hi = Math.ceil(Math.max(...vals) * 2) / 2 + 0.5;
    let g = "";
    for (let v = Math.ceil(lo); v <= hi; v += 1) {
      const y = T + ih - ((v - lo) / (hi - lo)) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 8, y + 4, v + "%", { anchor: "end", size: 10 });
    }
    const pts = vals.map((v, i) => {
      const x = L + (i / (vals.length - 1)) * iw;
      const y = T + ih - ((v - lo) / (hi - lo)) * ih;
      return [x, y];
    });
    const dPath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    g += `<path d="${dPath}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => {
      const last = i === pts.length - 1;
      const peak = vals[i] === Math.max(...vals);
      g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${last ? 5 : 3.4}"
              fill="#fff" stroke="${color}" stroke-width="${last ? 2.6 : 2}"/>`;
      g += txt(p[0], H - B + 16, D.years[i] + "", { anchor: "middle", size: 10 });
      if (last || peak) {
        g += txt(p[0], p[1] - 11, vals[i].toFixed(1) + "%",
                 { anchor: "middle", size: 10.5, fill: color, weight: 700 });
      }
    });
    const drop = (vals[vals.length - 1] - vals[vals.length - 2]).toFixed(1);
    g += txt(W - R, T - 4, `较上届 ${drop > 0 ? "+" : ""}${drop} pct`,
             { anchor: "end", size: 10.5, fill: color, weight: 600 });
    el(targetId).innerHTML = svg(W, H, g);
  }

  /* ---------- 3c. 会计职业迷你柱（总览页） ---------- */
  function renderAccMini() {
    const W = 440, H = 196, L = 56, R = 20, T = 30, B = 40;
    const iw = W - L - R, ih = H - T - B;
    const items = [{ k: "2021 届", v: 3.7 }, { k: "2025 届", v: 3.2 }];
    const maxV = 4.4;
    let g = "";
    for (let v = 0; v <= 4; v += 1) {
      const y = T + ih - (v / maxV) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 8, y + 4, v + "%", { anchor: "end", size: 10 });
    }
    const bw = 58;
    items.forEach((it, i) => {
      const cx = L + (iw / items.length) * (i + 0.5);
      const h = (it.v / maxV) * ih;
      const color = i === 0 ? DIM : RED;
      g += `<rect x="${cx - bw / 2}" y="${T + ih - h}" width="${bw}" height="${h}"
              fill="${color}" rx="3" opacity="${i === 0 ? 1 : 0.9}"/>`;
      g += txt(cx, T + ih - h - 8, it.v.toFixed(1) + "%",
               { anchor: "middle", size: 12, fill: i === 0 ? SUB : RED, weight: 700 });
      g += txt(cx, H - B + 18, it.k, { anchor: "middle", size: 11 });
    });
    g += txt(W - R, T - 8, `↓ ${((3.7 - 3.2) / 3.7 * 100).toFixed(0)}%`,
             { anchor: "end", size: 12, fill: RED, weight: 700 });
    el("chAcc").innerHTML = svg(W, H, g);
  }

  /* ---------- 4. 落实率两时点 ---------- */
  function renderFlow() {
    const W = 440, H = 200;
    const bars = [{ k: "毕业半年后", v: 89.0, c: DIM }, { k: "毕业五年后", v: 95.6, c: TEAL }];
    const L = 96, maxV = 100, iw = W - L - 60;
    let g = "";
    bars.forEach((b, i) => {
      const y = 44 + i * 76;
      g += txt(L - 12, y + 22, b.k, { anchor: "end", size: 12, fill: SUB });
      g += `<rect x="${L}" y="${y}" width="${iw}" height="30" fill="#f2f7f5" rx="4"/>`;
      g += `<rect x="${L}" y="${y}" width="${(b.v / maxV) * iw}" height="30" fill="${b.c}" rx="4"/>`;
      g += txt(L + (b.v / maxV) * iw + 10, y + 20, b.v.toFixed(1) + "%",
               { size: 14, fill: INK, weight: 700 });
    });
    g += txt(L, 22, "2020 届本科毕业生（全国）", { size: 11, fill: SUB });
    el("chFlow").innerHTML = svg(W, H, g);
  }

  /* ---------- 5. 学科门类双柱 ---------- */
  function renderSubj() {
    const rows = D.subjects;
    const W = 460, H = 330, L = 52, B = 52, T = 14, R = 12;
    const iw = W - L - R, ih = H - T - B;
    const min = 80, max = 100;
    let g = "";
    for (let v = min; v <= max; v += 5) {
      const y = T + ih - ((v - min) / (max - min)) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 6, y + 4, v, { anchor: "end", size: 10 });
    }
    const gw = iw / rows.length;
    const bw = gw * 0.3;
    rows.forEach((r, i) => {
      const cx = L + gw * i + gw / 2;
      const h1 = ((r.half - min) / (max - min)) * ih;
      const h2 = ((r.five - min) / (max - min)) * ih;
      g += `<rect x="${cx - bw - 2}" y="${T + ih - h1}" width="${bw}" height="${h1}" fill="${DIM}" rx="2"/>`;
      g += `<rect x="${cx + 2}" y="${T + ih - h2}" width="${bw}" height="${h2}"
              fill="${r.key ? TEAL : "#7cbfae"}" rx="2"/>`;
      g += txt(cx, H - B + 16, r.name, { anchor: "middle", size: 10,
               fill: r.key ? INK : SUB, weight: r.key ? 700 : 400 });
      if (r.key) {
        g += txt(cx, T + ih - h2 - 5, r.five.toFixed(1), { anchor: "middle", size: 9.5,
                 fill: TEAL, weight: 700 });
      }
    });
    el("chSubj").innerHTML = svg(W, H, g);
  }

  /* ---------- 6. 学位类型环形 ---------- */
  function donut(items, W, H, cx, cy, r, r2) {
    const total = items.reduce((s, x) => s + x.v, 0);
    let a0 = -Math.PI / 2, g = "";
    const colors = [TEAL, GOLD, BLUE];
    items.forEach((it, i) => {
      const a1 = a0 + (it.v / total) * Math.PI * 2;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r2 * Math.cos(a1), y2 = cy + r2 * Math.sin(a1);
      const x3 = cx + r2 * Math.cos(a0), y3 = cy + r2 * Math.sin(a0);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      g += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}
             L${x2.toFixed(1)} ${y2.toFixed(1)} A${r2} ${r2} 0 ${large} 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z"
             fill="${colors[i % colors.length]}" opacity="0.92"/>`;
      // 标签
      const am = (a0 + a1) / 2;
      const lx = cx + (r + 16) * Math.cos(am), ly = cy + (r + 16) * Math.sin(am);
      g += txt(lx, ly + 4, `${it.k} ${it.v}`, { anchor: Math.cos(am) > 0 ? "start" : "end",
               size: 10.5, fill: SUB });
      a0 = a1;
    });
    g += txt(cx, cy - 2, total, { anchor: "middle", size: 20, fill: INK, weight: 800 });
    g += txt(cx, cy + 16, "条档案", { anchor: "middle", size: 10, fill: SUB });
    return svg(W, H, g);
  }

  function renderDeg() {
    el("chDeg").innerHTML = donut(D.grad.degree, 420, 220, 210, 108, 74, 44);
  }

  /* ---------- 7. 学制条 ---------- */
  function renderYr() {
    const rows = D.grad.years, W = 420, H = 210, L = 118, maxV = 36, iw = W - L - 52;
    let g = "";
    rows.forEach((r, i) => {
      const y = 40 + i * 46;
      g += txt(L - 10, y + 18, r.k, { anchor: "end", size: 11.5, fill: SUB });
      const w = (r.v / maxV) * iw;
      g += `<rect x="${L}" y="${y}" width="${iw}" height="26" fill="#f2f7f5" rx="3"/>`;
      g += `<rect x="${L}" y="${y}" width="${w}" height="26" fill="${i === 1 ? RED : TEAL}"
              rx="3" opacity="${i === 1 ? 0.9 : 0.8}"/>`;
      g += txt(L + w + 8, y + 18, r.v + " 条", { size: 11.5, fill: INK, weight: 700 });
    });
    g += txt(L, 24, "66 条招生档案的学制分布", { size: 10.5, fill: SUB });
    el("chYr").innerHTML = svg(W, H, g);
  }

  /* ---------- 8. 招生规模堆叠 ---------- */
  function renderPlan() {
    const W = 420, H = 148;
    const full = D.grad.plan.full, part = D.grad.plan.part, tot = full + part;
    const L = 14, iw = W - 28, bh = 34, y = 34;
    const wf = (full / tot) * iw, wp = (part / tot) * iw;
    let g = "";
    g += `<rect x="${L}" y="${y}" width="${wf}" height="${bh}" fill="${TEAL}" rx="3"/>`;
    g += `<rect x="${L + wf}" y="${y}" width="${wp}" height="${bh}" fill="${GOLD}" rx="3"/>`;
    g += txt(L + wf / 2, y + 22, `全日制 ${full}`, { anchor: "middle", size: 12, fill: "#fff", weight: 700 });
    g += txt(L + wf + wp / 2, y + 22, `非全 ${part}`, { anchor: "middle", size: 12, fill: "#fff", weight: 700 });
    g += txt(L, 20, `2027 年拟招生 ${tot} 人`, { size: 11, fill: SUB });
    g += txt(L, y + bh + 24, `非全占 ${(part / tot * 100).toFixed(1)}%（专业条目仅占 12%）`,
             { size: 11, fill: GOLD, weight: 600 });
    el("chPlan").innerHTML = svg(W, H, g);
  }

  /* ---------- 9. 学费条 ---------- */
  function renderFee() {
    const rows = D.grad.fee, W = 420, H = 190, L = 150, maxV = 100000, iw = W - L - 76;
    let g = "";
    rows.forEach((r, i) => {
      const y = 34 + i * 50;
      g += txt(L - 10, y + 17, r.k, { anchor: "end", size: 11, fill: SUB });
      const w = (r.v / maxV) * iw;
      g += `<rect x="${L}" y="${y}" width="${iw}" height="24" fill="#f7f3ea" rx="3"/>`;
      g += `<rect x="${L}" y="${y}" width="${w}" height="24" fill="${GOLD}" rx="3"
              opacity="${0.55 + i * 0.18}"/>`;
      g += txt(L + w + 8, y + 17, (r.v / 10000).toFixed(1) + " 万",
               { size: 11.5, fill: INK, weight: 700 });
    });
    el("chFee").innerHTML = svg(W, H, g);
  }

  /* ---------- 10. AI 双柱 ---------- */
  function renderAi() {
    const W = 900, H = 240, L = 132, B = 40, T = 20, R = 60;
    const iw = W - L - R, ih = H - T - B;
    const maxV = 4;
    let g = "";
    for (let v = 0; v <= maxV; v += 1) {
      const y = T + ih - (v / maxV) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 6, y + 4, v + "%", { anchor: "end", size: 10 });
    }
    const gw = iw / D.ai.length, bw = 74;
    D.ai.forEach((it, i) => {
      const cx = L + gw * i + gw / 2;
      const h1 = (it.from / maxV) * ih, h2 = (it.to / maxV) * ih;
      g += `<rect x="${cx - bw - 6}" y="${T + ih - h1}" width="${bw}" height="${h1}" fill="${DIM}" rx="3"/>`;
      g += `<rect x="${cx + 6}" y="${T + ih - h2}" width="${bw}" height="${h2}" fill="${RED}" rx="3"
              opacity="0.9"/>`;
      g += txt(cx - 6 - bw / 2, T + ih - h1 - 8, it.from.toFixed(1) + "%",
               { anchor: "middle", size: 11, fill: SUB, weight: 600 });
      g += txt(cx + 6 + bw / 2, T + ih - h2 - 8, it.to.toFixed(1) + "%",
               { anchor: "middle", size: 11, fill: RED, weight: 700 });
      const drop = ((it.from - it.to) / it.from * 100).toFixed(0);
      g += txt(cx, H - B + 20, `${it.name}　↓${drop}%`, { anchor: "middle", size: 12,
               fill: INK, weight: 600 });
    });
    el("chAi").innerHTML = svg(W, H, g);
  }

  /* ---------- 11. 会计能力满足度 ---------- */
  function renderSkill() {
    const rows = [
      { k: "分析决策能力", v: 93 },
      { k: "数据分析能力", v: 92 },
      { k: "工作与专业相关度", v: 75 }
    ];
    const W = 420, H = 200, L = 140, maxV = 100, iw = W - L - 54;
    let g = "";
    rows.forEach((r, i) => {
      const y = 38 + i * 48;
      g += txt(L - 10, y + 18, r.k, { anchor: "end", size: 11, fill: SUB });
      const w = (r.v / maxV) * iw;
      g += `<rect x="${L}" y="${y}" width="${iw}" height="24" fill="#f2f7f5" rx="3"/>`;
      g += `<rect x="${L}" y="${y}" width="${w}" height="24"
              fill="${i === 2 ? GOLD : TEAL}" rx="3" opacity="0.82"/>`;
      g += txt(L + w + 8, y + 17, r.v + "%", { size: 11.5, fill: INK, weight: 700 });
    });
    el("chSkill").innerHTML = svg(W, H, g);
  }

  /* ---------- 12. 表格 ---------- */
  function renderTables() {
    // 院校
    const badge = (s) => s === "ok" ? '<span class="badge b-ok">官网确认</span>'
      : s === "fix" ? '<span class="badge b-fix">已修正</span>'
      : s === "part" ? '<span class="badge b-fix">部分</span>'
      : '<span class="badge b-no">未获取</span>';
    let h = `<thead><tr><th>院校</th><th>类别</th><th>硕士项目</th><th>学制</th>
             <th style="width:96px">状态</th><th style="width:24%">依据</th></tr></thead><tbody>`;
    D.schools.forEach(s => {
      h += `<tr><td><b>${s.n}</b></td><td>${s.t}</td><td>${s.p}</td>
            <td>${s.y}</td><td>${badge(s.s)}</td>
            <td style="color:#7a8a86;font-size:11.5px">${s.note}</td></tr>`;
    });
    h += "</tbody>";
    el("schoolTable").innerHTML = h;

    // 来源
    let h2 = `<thead><tr><th style="width:16%">项目</th><th>来源与口径</th>
              <th style="width:96px">状态</th></tr></thead><tbody>`;
    D.sources.forEach(s => {
      const b = s.s === "ok" ? '<span class="badge b-ok">可用</span>'
                             : '<span class="badge b-no">不可用</span>';
      h2 += `<tr><td><b>${s.k}</b></td><td>${s.v}</td><td>${b}</td></tr>`;
    });
    h2 += "</tbody>";
    el("srcTable").innerHTML = h2;

    // AI 事实
    el("aiList").innerHTML = D.aiFacts.map(f => `<li>${f}</li>`).join("");
  }

  /* ---------- 导航 ---------- */
  function initNav() {
    const views = Array.from(document.querySelectorAll(".view"));
    const btns = Array.from(document.querySelectorAll(".side button"));
    function go(v) {
      views.forEach(s => s.classList.toggle("on", s.id === "v-" + v));
      btns.forEach(b => b.classList.toggle("on", b.dataset.v === v));
      window.scrollTo({ top: 0, behavior: "smooth" });
      try { history.replaceState(null, "", "#" + v); } catch (e) {}
    }
    btns.forEach(b => b.addEventListener("click", () => go(b.dataset.v)));
    const hash = (location.hash || "").replace("#", "");
    if (hash && document.getElementById("v-" + hash)) go(hash);
    window.go = go;
  }

  /* ---------- 启动 ---------- */
  function boot() {
    renderKpis();
    renderMini(D.industries.find(x => x.key), "chFin", RED);
    renderAccMini();
    renderLine();
    renderBar();
    renderFlow();
    renderSubj();
    renderDeg();
    renderYr();
    renderPlan();
    renderFee();
    renderAi();
    renderSkill();
    renderTables();
    initNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
