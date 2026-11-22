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
    `text-anchor="${o.anchor || "start"}">${s}</text>`;

  /* ---------- KPI ---------- */
  function renderKpis() {
    el("kpiBox").innerHTML = D.kpi.map(k => `
      <div class="kpi ${k.cls}">
        <div class="n">${k.n}<small>${k.u}</small></div>
        <div class="l">${k.l}</div>
        <div class="d">${k.d}</div>
      </div>`).join("");
  }

  /* ---------- 数据边界表 ---------- */
  function renderLegend() {
    let h = `<thead><tr><th style="width:34px">标记</th><th style="width:14%">性质</th>
             <th style="width:30%">来源</th><th>怎么用</th></tr></thead><tbody>`;
    D.legend.forEach(l => {
      const color = l.mark === "●" ? TEAL : (l.mark === "▲" ? GOLD : BLUE);
      h += `<tr><td style="color:${color};font-size:15px;text-align:center">${l.mark}</td>
            <td><b>${l.k}</b></td><td>${l.src}</td><td>${l.use}</td></tr>`;
    });
    el("legendTb").innerHTML = h + "</tbody>";
  }

  /* ---------- 迷你折线 ---------- */
  function renderMini(ind, targetId, color) {
    const W = 440, H = 196, L = 40, R = 18, T = 22, B = 34;
    const iw = W - L - R, ih = H - T - B;
    const vals = ind.v;
    const lo = Math.floor(Math.min(...vals)) - 0.5;
    const hi = Math.ceil(Math.max(...vals)) + 0.8;
    let g = "";
    for (let v = Math.ceil(lo); v <= hi; v += 1) {
      const y = T + ih - ((v - lo) / (hi - lo)) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 8, y + 4, v + "%", { anchor: "end", size: 10 });
    }
    const pts = vals.map((v, i) => [
      L + (i / (vals.length - 1)) * iw,
      T + ih - ((v - lo) / (hi - lo)) * ih
    ]);
    g += `<path d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")}"
            fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => {
      const last = i === pts.length - 1;
      const peak = vals[i] === Math.max(...vals);
      g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${last ? 5 : 3.4}"
              fill="#fff" stroke="${color}" stroke-width="${last ? 2.6 : 2}"/>`;
      g += txt(p[0], H - B + 16, D.years[i] + "", { anchor: "middle", size: 10 });
      if (last || peak) {
        g += txt(p[0], p[1] - 11, vals[i].toFixed(1) + "%",
                 { anchor: "middle", size: 10.5, fill: color });
      }
    });
    el(targetId).innerHTML = svg(W, H, g);
  }

  /* ---------- 会计迷你柱 ---------- */
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
      const hh = (it.v / maxV) * ih;
      g += `<rect x="${cx - bw / 2}" y="${T + ih - hh}" width="${bw}" height="${hh}"
              fill="${i === 0 ? DIM : RED}" rx="3" opacity="${i === 0 ? 1 : 0.9}"/>`;
      g += txt(cx, T + ih - hh - 8, it.v.toFixed(1) + "%",
               { anchor: "middle", size: 12, fill: i === 0 ? SUB : RED });
      g += txt(cx, H - B + 18, it.k, { anchor: "middle", size: 11 });
    });
    el("chAcc").innerHTML = svg(W, H, g);
  }

  /* ---------- 行业折线 ---------- */
  function renderLine() {
    const W = 940, H = 360, L = 46, R = 16, T = 16, B = 44;
    const iw = W - L - R, ih = H - T - B, yMax = 16;
    let g = "";
    for (let v = 0; v <= yMax; v += 4) {
      const y = T + ih - (v / yMax) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 8, y + 4, v + "%", { anchor: "end", size: 10.5 });
    }
    D.years.forEach((yr, i) => {
      const x = L + (i / (D.years.length - 1)) * iw;
      g += `<line x1="${x}" y1="${T}" x2="${x}" y2="${T + ih}" stroke="${LINE}" stroke-dasharray="2 4"/>`;
      g += txt(x, H - B + 18, yr + " 届", { anchor: "middle", size: 10.5 });
    });
    D.industries.forEach((ind, k) => {
      const pts = ind.v.map((v, i) => [
        L + (i / (D.years.length - 1)) * iw,
        T + ih - (v / yMax) * ih
      ]);
      const color = ind.key ? RED : (ind.warn ? GOLD : PALETTE[k % PALETTE.length]);
      const w = ind.key || ind.warn ? 3 : 1.6;
      const op = ind.key || ind.warn ? 1 : 0.5;
      g += `<path d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")}"
              fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linejoin="round"/>`;
      if (ind.key || ind.warn) {
        pts.forEach((p, i) => {
          g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4"
                  fill="#fff" stroke="${color}" stroke-width="2"/>`;
          if (i === pts.length - 1) {
            g += txt(p[0] - 6, p[1] - 10, ind.v[i].toFixed(1) + "%",
                     { anchor: "end", size: 11, fill: color });
          }
        });
      }
    });
    el("chLine").innerHTML = svg(W, H, g);
    el("lgLine").innerHTML = D.industries.map((ind, k) => {
      const color = ind.key ? RED : (ind.warn ? GOLD : PALETTE[k % PALETTE.length]);
      const c = ind.chg > 0 ? TEAL : (ind.chg < 0 ? RED : SUB);
      return `<span><i style="background:${color}"></i>${ind.name}
        <b style="color:${c}">${ind.chg > 0 ? "+" : ""}${ind.chg}</b></span>`;
    }).join("");
  }

  /* ---------- 行业条形 ---------- */
  function renderBar() {
    const rows = D.industries.slice().sort((a, b) => b.v[4] - a.v[4]);
    const rowH = 30, W = 940, L = 250, R = 150, T = 8;
    const H = T + rows.length * rowH + 26, maxV = 15, iw = W - L - R;
    let g = "";
    rows.forEach((ind, i) => {
      const y = T + i * rowH, by = y + 6, bh = 16;
      const w = (ind.v[4] / maxV) * iw;
      const color = ind.key ? RED : (ind.warn ? GOLD : "#5aa693");
      g += txt(L - 10, by + 12, ind.name.length > 13 ? ind.name.slice(0, 13) + "…" : ind.name,
               { anchor: "end", size: 11, fill: ind.key || ind.warn ? INK : SUB });
      g += `<rect x="${L}" y="${by}" width="${w.toFixed(1)}" height="${bh}" fill="${color}" rx="3"
              opacity="${ind.key || ind.warn ? 0.95 : 0.7}"/>`;
      g += txt(L + w + 8, by + 12, ind.v[4].toFixed(1) + "%", { size: 11, fill: INK });
      const up = ind.chg > 0;
      g += txt(W - R + 40, by + 12,
               (up ? "▲ +" : (ind.chg === 0 ? "— " : "▼ ")) + ind.chg.toFixed(1),
               { size: 11, fill: up ? TEAL : (ind.chg === 0 ? SUB : RED) });
    });
    g += txt(L - 10, H - 8, "2025 届就业占比", { anchor: "end", size: 10.5 });
    g += txt(W - R + 40, H - 8, "较 2021 届（pct）", { size: 10.5 });
    el("chBar").innerHTML = svg(W, H, g);
  }

  /* ---------- 央财行业分布（区间） ---------- */
  function renderCufeInd() {
    const rows = D.cufeIndustry, W = 470, L = 168, R = 62, T = 10;
    const rowH = 34, H = T + rows.length * rowH + 16, iw = W - L - R, maxV = 50;
    let g = "";
    rows.forEach((r, i) => {
      const y = T + i * rowH, by = y + 7, bh = 15;
      const lo = (r.range[0] / maxV) * iw, hi = (r.range[1] / maxV) * iw;
      const nm = r.name.length > 11 ? r.name.slice(0, 11) + "…" : r.name;
      g += txt(L - 8, by + 11, nm, { anchor: "end", size: 10.5,
               fill: r.key ? INK : SUB });
      g += `<rect x="${L}" y="${by}" width="${iw}" height="${bh}" fill="#f4f8f7" rx="3"/>`;
      g += `<rect x="${L + lo}" y="${by}" width="${(hi - lo).toFixed(1)}" height="${bh}"
              fill="${r.key ? RED : "#5aa693"}" rx="3" opacity="${r.key ? 0.92 : 0.6}"/>`;
      g += txt(L + hi + 7, by + 11, `${r.range[0]}—${r.range[1]}%`,
               { size: 10.5, fill: INK });
    });
    el("chCufeInd").innerHTML = svg(W, H, g);
  }

  /* ---------- 地域分布 ---------- */
  function renderRegion() {
    const rows = D.cufeRegion, W = 460, L = 150, R = 60, T = 10;
    const rowH = 34, H = T + rows.length * rowH + 16, iw = W - L - R, maxV = 58;
    let g = "";
    rows.forEach((r, i) => {
      const y = T + i * rowH, by = y + 7, bh = 15;
      const lo = (r.range[0] / maxV) * iw, hi = (r.range[1] / maxV) * iw;
      g += txt(L - 8, by + 11, r.name, { anchor: "end", size: 10.5 });
      g += `<rect x="${L}" y="${by}" width="${iw}" height="${bh}" fill="#f4f8f7" rx="3"/>`;
      g += `<rect x="${L + lo}" y="${by}" width="${(hi - lo).toFixed(1)}" height="${bh}"
              fill="${i === 0 ? GOLD : "#4a8fb5"}" rx="3" opacity="${i === 0 ? 0.9 : 0.62}"/>`;
      g += txt(L + hi + 7, by + 11, `${r.range[0]}—${r.range[1]}%`, { size: 10.5, fill: INK });
    });
    el("chRegion").innerHTML = svg(W, H, g);
  }

  /* ---------- 全国落实率 ---------- */
  function renderFlow() {
    const W = 440, H = 190, L = 96, maxV = 100, iw = W - L - 60;
    const bars = [{ k: "毕业半年后", v: 89.0, c: DIM }, { k: "毕业五年后", v: 95.6, c: TEAL }];
    let g = txt(L, 22, "2020 届本科毕业生（全国）", { size: 11 });
    bars.forEach((b, i) => {
      const y = 40 + i * 72;
      g += txt(L - 12, y + 21, b.k, { anchor: "end", size: 12 });
      g += `<rect x="${L}" y="${y}" width="${iw}" height="28" fill="#f2f7f5" rx="4"/>`;
      g += `<rect x="${L}" y="${y}" width="${(b.v / maxV) * iw}" height="28" fill="${b.c}" rx="4"/>`;
      g += txt(L + (b.v / maxV) * iw + 10, y + 19, b.v.toFixed(1) + "%",
               { size: 14, fill: INK });
    });
    el("chFlow").innerHTML = svg(W, H, g);
  }

  /* ---------- 学科双柱 ---------- */
  function renderSubj() {
    const rows = D.subjects, W = 460, H = 320, L = 50, B = 50, T = 14, R = 12;
    const iw = W - L - R, ih = H - T - B, min = 80, max = 100;
    let g = "";
    for (let v = min; v <= max; v += 5) {
      const y = T + ih - ((v - min) / (max - min)) * ih;
      g += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${LINE}"/>`;
      g += txt(L - 6, y + 4, v, { anchor: "end", size: 10 });
    }
    const gw = iw / rows.length, bw = gw * 0.3;
    rows.forEach((r, i) => {
      const cx = L + gw * i + gw / 2;
      const h1 = ((r.half - min) / (max - min)) * ih;
      const h2 = ((r.five - min) / (max - min)) * ih;
      g += `<rect x="${cx - bw - 2}" y="${T + ih - h1}" width="${bw}" height="${h1}" fill="${DIM}" rx="2"/>`;
      g += `<rect x="${cx + 2}" y="${T + ih - h2}" width="${bw}" height="${h2}"
              fill="${r.key ? TEAL : "#7cbfae"}" rx="2"/>`;
      g += txt(cx, H - B + 16, r.name, { anchor: "middle", size: 9.5,
               fill: r.key ? INK : SUB });
    });
    el("chSubj").innerHTML = svg(W, H, g);
  }

  /* ---------- 央财三届去向区间 ---------- */
  function renderCufeFlow() {
    const rows = D.cufeFlow, W = 940, L = 168, R = 40, T = 30;
    const rowH = 46, H = T + rows.length * rowH + 20, iw = W - L - R, maxV = 100;
    const yrs = ["2023 届", "2024 届", "2025 届"];
    const colors = ["#7cbfae", "#3f9d88", "#0f7a66"];
    let g = "";
    // 轴
    for (let v = 0; v <= 100; v += 25) {
      const x = L + (v / maxV) * iw;
      g += `<line x1="${x}" y1="${T - 10}" x2="${x}" y2="${H - 20}" stroke="${LINE}" stroke-dasharray="2 4"/>`;
      g += txt(x, H - 8, v + "%", { anchor: "middle", size: 9.5 });
    }
    yrs.forEach((y, i) => {
      g += txt(L + (i + 0.5) * 0 + 0, 0, "", {});
    });
    rows.forEach((r, i) => {
      const y = T + i * rowH;
      g += txt(L - 10, y + 22, r.k, { anchor: "end", size: 10.5 });
      r.v.forEach((rng, j) => {
        const by = y + j * 11.5;
        const lo = (rng[0] / maxV) * iw, hi = (rng[1] / maxV) * iw;
        g += `<rect x="${L + lo}" y="${by}" width="${(hi - lo).toFixed(1)}" height="8"
                fill="${colors[j]}" rx="4" opacity="0.88"/>`;
      });
      // 末年区间文字
      const last = r.v[2];
      g += txt(L + (last[1] / maxV) * iw + 8, y + 30, `${last[0]}—${last[1]}%`,
               { size: 10, fill: INK });
    });
    // 年份图例
    yrs.forEach((y, i) => {
      g += `<rect x="${L + i * 96}" y="${T - 26}" width="10" height="10" fill="${colors[i]}" rx="2"/>`;
      g += txt(L + i * 96 + 15, T - 17, y, { size: 10 });
    });
    el("chCufeFlow").innerHTML = svg(W, H, g);
  }

  /* ---------- 分流表 ---------- */
  function renderTracks() {
    let h = `<thead><tr><th style="width:14%">主链</th><th style="width:24%">典型比例（▲）</th>
             <th style="width:30%">决定因素</th><th>对应岗位族</th></tr></thead><tbody>`;
    D.tracks.forEach(t => {
      h += `<tr${t.key ? ' class="hl"' : ''}><td><b>${t.k}</b></td><td>${t.ratio}</td>
            <td>${t.factor}</td><td>${t.post}</td></tr>`;
    });
    el("trackTb").innerHTML = h + "</tbody>";
  }

  /* ---------- 45 专业 ---------- */
  let majorFilter = "全部";
  function renderMajors() {
    const all = D.majors;
    const depts = ["全部", ...Array.from(new Set(all.map(m => m[0])))];
    el("majorFilter").innerHTML = depts.map(d =>
      `<button data-d="${d}" class="fbtn${d === majorFilter ? " on" : ""}">${d}</button>`).join("");
    el("majorFilter").querySelectorAll("button").forEach(b => {
      b.onclick = () => { majorFilter = b.dataset.d; renderMajors(); };
    });

    const rows = all.filter(m => majorFilter === "全部" || m[0] === majorFilter)
      .slice().sort((a, b) => (b[6][0] + b[6][1]) - (a[6][0] + a[6][1]));
    const DEPTH = { "很高": 4, "高": 3, "中高": 2, "中": 1 };
    const rowH = 22, W = 940, L = 210, R = 118, T = 6;
    const H = T + rows.length * rowH + 18, iw = W - L - R, maxV = 100;
    let g = "";
    rows.forEach((m, i) => {
      const y = T + i * rowH, by = y + 6, bh = 11;
      const lo = (m[6][0] / maxV) * iw, hi = (m[6][1] / maxV) * iw;
      const lvl = DEPTH[m[5]] || 1;
      const color = lvl >= 4 ? BLUE : lvl === 3 ? TEAL : lvl === 2 ? "#4a8fb5" : "#a9bdb8";
      g += txt(L - 8, by + 9, m[1], { anchor: "end", size: 10, fill: INK });
      g += `<rect x="${L}" y="${by}" width="${iw}" height="${bh}" fill="#f5f8f7" rx="3"/>`;
      g += `<rect x="${L + lo}" y="${by}" width="${(hi - lo).toFixed(1)}" height="${bh}"
              fill="${color}" rx="3" opacity="0.82"/>`;
      g += txt(L + hi + 6, by + 9, `${m[6][0]}—${m[6][1]}%`, { size: 9.5, fill: SUB });
      g += txt(W - R + 76, by + 9, m[5], { size: 9.5, fill: color });
    });
    el("chMajor").innerHTML = svg(W, H, g) +
      `<div class="legend" style="margin-top:8px">
        <span><i style="background:${BLUE}"></i>很高</span>
        <span><i style="background:${TEAL}"></i>高</span>
        <span><i style="background:#4a8fb5"></i>中高</span>
        <span><i style="background:#a9bdb8"></i>中</span>
        <span style="color:#8a9a96">右侧文字＝深造倾向</span>
      </div>`;
  }

  function renderMajorTable() {
    const rows = D.majors.filter(m => majorFilter === "全部" || m[0] === majorFilter);
    let h = `<thead><tr><th style="width:26px">#</th><th>学院</th><th>专业</th><th>门类</th>
             <th style="width:22%">主要行业</th><th style="width:18%">典型岗位</th>
             <th style="width:64px">深造</th><th style="width:86px">对口率</th>
             <th style="width:96px">招生规模</th></tr></thead><tbody>`;
    rows.forEach((m, i) => {
      h += `<tr><td class="num">${i + 1}</td><td style="font-size:11px;color:#7a8a86">${m[0]}</td>
        <td><b>${m[1]}</b></td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td>
        <td>${m[5]}</td><td class="num">${m[6][0]}—${m[6][1]}%</td>
        <td class="num">${m[7][0]}—${m[7][1]}</td></tr>`;
    });
    el("tblMajors").innerHTML = h + "</tbody>";
  }

  /* ---------- 学位类型环形 ---------- */
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
      const am = (a0 + a1) / 2;
      g += txt(cx + (r + 18) * Math.cos(am), cy + (r + 18) * Math.sin(am) + 4,
               `${it.k} ${it.v}`, { anchor: Math.cos(am) > 0 ? "start" : "end", size: 10 });
      a0 = a1;
    });
    g += txt(cx, cy - 2, total, { anchor: "middle", size: 20, fill: INK });
    g += txt(cx, cy + 16, "条档案", { anchor: "middle", size: 10 });
    return svg(W, H, g);
  }

  function renderDeg() {
    el("chDeg").innerHTML = donut(D.grad.degree, 420, 210, 210, 104, 70, 42);
    let h = `<thead><tr><th>类型</th><th style="width:52px">条数</th><th>特征</th></tr></thead><tbody>`;
    D.grad.degree.forEach(d => {
      h += `<tr><td><b>${d.k}</b><div style="font-size:10.5px;color:#8a9a96">${d.eg}</div></td>
            <td class="num">${d.v}</td><td style="font-size:11.5px">${d.note}</td></tr>`;
    });
    el("degTb").innerHTML = h + "</tbody>";
  }

  function renderYr() {
    const rows = D.grad.years, W = 420, H = 200, L = 118, maxV = 36, iw = W - L - 52;
    let g = txt(L, 24, "66 条档案的学制分布", { size: 10.5 });
    rows.forEach((r, i) => {
      const y = 40 + i * 44;
      g += txt(L - 10, y + 17, r.k, { anchor: "end", size: 11 });
      const w = (r.v / maxV) * iw;
      g += `<rect x="${L}" y="${y}" width="${iw}" height="24" fill="#f2f7f5" rx="3"/>`;
      g += `<rect x="${L}" y="${y}" width="${w}" height="24" fill="${i === 1 ? RED : TEAL}"
              rx="3" opacity="0.82"/>`;
      g += txt(L + w + 8, y + 17, r.v + " 条", { size: 11, fill: INK });
    });
    el("chYr").innerHTML = svg(W, H, g);
  }

  function renderDir() {
    let h = `<thead><tr><th style="width:96px">专业</th><th style="width:96px">学位</th>
             <th style="width:110px">学制</th><th>方向（节选）</th></tr></thead><tbody>`;
    D.grad.directions.forEach(d => {
      h += `<tr><td><b>${d.major}</b></td><td>${d.degree}</td><td>${d.year}</td>
            <td style="font-size:11.5px">${d.dir}</td></tr>`;
    });
    el("dirTb").innerHTML = h + "</tbody>";
    el("exclusiveNote").textContent = D.grad.exclusive;
  }

  function renderPlan() {
    const W = 420, H = 132;
    const full = D.grad.plan.full, part = D.grad.plan.part, tot = full + part;
    const L = 14, iw = W - 28, bh = 34, y = 34;
    const wf = (full / tot) * iw, wp = (part / tot) * iw;
    let g = txt(L, 20, `2027 年拟招生 ${tot} 人`, { size: 11 });
    g += `<rect x="${L}" y="${y}" width="${wf}" height="${bh}" fill="${TEAL}" rx="3"/>`;
    g += `<rect x="${L + wf}" y="${y}" width="${wp}" height="${bh}" fill="${GOLD}" rx="3"/>`;
    g += txt(L + wf / 2, y + 22, `全日制 ${full}`, { anchor: "middle", size: 12, fill: "#fff" });
    g += txt(L + wf + wp / 2, y + 22, `非全 ${part}`, { anchor: "middle", size: 12, fill: "#fff" });
    g += txt(L, y + bh + 24, `非全占 ${(part / tot * 100).toFixed(1)}%（专业条目仅占 12%）`,
             { size: 11, fill: GOLD });
    el("chPlan").innerHTML = svg(W, H, g);
  }

  function renderFee() {
    const rows = D.grad.fee, W = 420, H = 180, L = 150, maxV = 100000, iw = W - L - 76;
    let g = "";
    rows.forEach((r, i) => {
      const y = 30 + i * 46;
      g += txt(L - 10, y + 16, r.k, { anchor: "end", size: 10.5 });
      const w = (r.v / maxV) * iw;
      g += `<rect x="${L}" y="${y}" width="${iw}" height="22" fill="#f7f3ea" rx="3"/>`;
      g += `<rect x="${L}" y="${y}" width="${w}" height="22" fill="${GOLD}" rx="3"
              opacity="${0.55 + i * 0.18}"/>`;
      g += txt(L + w + 8, y + 16, (r.v / 10000).toFixed(1) + " 万", { size: 11, fill: INK });
    });
    el("chFee").innerHTML = svg(W, H, g);
  }

  /* ---------- 岗位族 ---------- */
  function renderFamilies() {
    const rows = D.families, W = 940, L = 200, R = 150, T = 8;
    const rowH = 34, H = T + rows.length * rowH + 18, iw = W - L - R, maxV = 100;
    let g = "";
    rows.forEach((f, i) => {
      const y = T + i * rowH, by = y + 7, bh = 17;
      const w = (f.ratio / maxV) * iw;
      const strong = f.ratio >= 64;
      g += txt(L - 10, by + 12, f.name, { anchor: "end", size: 11, fill: strong ? INK : SUB });
      g += `<rect x="${L}" y="${by}" width="${iw}" height="${bh}" fill="#f4f8f7" rx="3"/>`;
      g += `<rect x="${L}" y="${by}" width="${w.toFixed(1)}" height="${bh}"
              fill="${strong ? TEAL : GOLD}" rx="3" opacity="${strong ? 0.85 : 0.7}"/>`;
      g += txt(L + w + 8, by + 12, f.ratio + "%", { size: 11, fill: INK });
      g += txt(W - R + 56, by + 12, `${f.salary[0]}—${f.salary[1]} 万/年`,
               { size: 10.5, fill: SUB });
    });
    g += txt(L - 10, H - 6, "本科可报岗位占比", { anchor: "end", size: 10 });
    g += txt(W - R + 56, H - 6, "起薪区间（■ 模型）", { size: 10 });
    el("chFamilies").innerHTML = svg(W, H, g) +
      `<div class="legend" style="margin-top:10px">
        <span><i style="background:${TEAL}"></i>本科可报 ≥ 64%（不读研也能进）</span>
        <span><i style="background:${GOLD}"></i>本科可报 &lt; 64%（硕士门槛）</span>
      </div>`;
  }

  function renderSkills() {
    let h = `<thead><tr><th style="width:26px">#</th><th style="width:24%">技能 / 能力</th>
             <th style="width:22%">需求岗位</th><th style="width:56px">强度</th>
             <th>现有课程支撑</th><th style="width:88px">缺口判断</th></tr></thead><tbody>`;
    const col = { "显著缺口": RED, "部分缺口": GOLD, "基本满足": TEAL };
    D.skills.forEach((s, i) => {
      h += `<tr><td class="num">${i + 1}</td><td><b>${s.name}</b></td>
        <td style="font-size:11.5px">${s.jobs}</td><td>${s.strength}</td>
        <td style="font-size:11.5px">${s.support}</td>
        <td><span class="badge" style="background:${col[s.gap]}22;color:${col[s.gap]}">${s.gap}</span></td></tr>`;
    });
    el("skillTb").innerHTML = h + "</tbody>";
  }

  /* ---------- 三条路径 ---------- */
  function renderPaths() {
    el("pathsBox").innerHTML = D.paths.map((p, idx) => `
      <div class="panel">
        <h2 style="color:${p.color}">${p.name}</h2>
        <div class="pathflow" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px">
          ${p.steps.map((s, i) => `
            <div style="position:relative;background:#fafcfb;border:1px solid ${LINE};
                 border-top:3px solid ${p.color};border-radius:8px;padding:10px 12px">
              <div style="font-size:10.5px;color:${p.color};font-weight:700;letter-spacing:.05em">
                ${String(i + 1).padStart(2, "0")}　${s[0]}</div>
              <div style="font-size:12px;line-height:1.7;margin-top:6px;color:#2a423c">${s[1]}</div>
              <div style="font-size:10.5px;color:#8a9a96;margin-top:8px">⏱ ${s[2]}</div>
            </div>`).join("")}
        </div>
      </div>`).join("");
  }

  function renderExits() {
    let h = `<thead><tr><th style="width:96px">路径</th><th style="width:20%">入口</th>
             <th style="width:30%">过程</th><th>出口</th></tr></thead><tbody>`;
    D.exits.forEach(e => {
      h += `<tr><td><b>${e.k}</b></td><td>${e.entry}</td><td>${e.process}</td><td>${e.out}</td></tr>`;
    });
    el("exitTb").innerHTML = h + "</tbody>";
  }

  /* ---------- 院校 ---------- */
  function renderSchool() {
    const badge = (s) => s === "ok" ? '<span class="badge b-ok">一致</span>'
      : s === "fix" ? '<span class="badge b-fix">已修正</span>'
      : s === "part" ? '<span class="badge b-fix">部分</span>'
      : '<span class="badge b-no">未获取</span>';
    let h = `<thead><tr><th style="width:118px">院校</th><th style="width:64px">类别</th>
             <th style="width:14%">财经主干院系</th><th style="width:20%">硕士项目</th>
             <th style="width:22%">现结论（学制）</th><th style="width:12%">原判断</th>
             <th style="width:70px">状态</th></tr></thead><tbody>`;
    D.schools.forEach(s => {
      h += `<tr><td><b>${s.n}</b></td><td style="font-size:11px;color:#7a8a86">${s.t}</td>
        <td style="font-size:11px">${s.dept}</td><td>${s.p}</td>
        <td style="font-size:11.5px">${s.y}
          <div style="font-size:10px;color:#a0aca8;margin-top:3px">${s.note}</div></td>
        <td style="font-size:11px;color:#9aa8a4;text-decoration:line-through">${s.old}</td>
        <td>${badge(s.s)}</td></tr>`;
    });
    el("schoolTable").innerHTML = h + "</tbody>";

    let c = `<thead><tr><th style="width:14%">维度</th><th>五财一贸</th><th>清北复交人</th></tr></thead><tbody>`;
    D.compare.forEach(x => {
      c += `<tr><td><b>${x.dim}</b></td><td>${x.a}</td><td>${x.b}</td></tr>`;
    });
    el("compareTb").innerHTML = c + "</tbody>";
  }

  /* ---------- AI ---------- */
  function renderAi() {
    const W = 900, H = 220, L = 132, B = 38, T = 20, R = 60;
    const iw = W - L - R, ih = H - T - B, maxV = 4;
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
      g += `<rect x="${cx + 6}" y="${T + ih - h2}" width="${bw}" height="${h2}" fill="${RED}" rx="3" opacity="0.9"/>`;
      g += txt(cx - 6 - bw / 2, T + ih - h1 - 8, it.from.toFixed(1) + "%",
               { anchor: "middle", size: 11 });
      g += txt(cx + 6 + bw / 2, T + ih - h2 - 8, it.to.toFixed(1) + "%",
               { anchor: "middle", size: 11, fill: RED });
      const drop = ((it.from - it.to) / it.from * 100).toFixed(0);
      g += txt(cx, H - B + 20, `${it.name}　↓${drop}%`,
               { anchor: "middle", size: 12, fill: INK });
    });
    el("chAi").innerHTML = svg(W, H, g);
    el("aiList").innerHTML = D.aiFacts.map(f => `<li>${f}</li>`).join("");
  }

  function renderSkillChart() {
    const rows = [
      { k: "分析决策能力", v: 93 }, { k: "数据分析能力", v: 92 }, { k: "工作与专业相关度", v: 75 }
    ];
    const W = 420, H = 190, L = 140, maxV = 100, iw = W - L - 54;
    let g = "";
    rows.forEach((r, i) => {
      const y = 34 + i * 46;
      g += txt(L - 10, y + 17, r.k, { anchor: "end", size: 10.5 });
      const w = (r.v / maxV) * iw;
      g += `<rect x="${L}" y="${y}" width="${iw}" height="22" fill="#f2f7f5" rx="3"/>`;
      g += `<rect x="${L}" y="${y}" width="${w}" height="22" fill="${i === 2 ? GOLD : TEAL}"
              rx="3" opacity="0.82"/>`;
      g += txt(L + w + 8, y + 16, r.v + "%", { size: 11, fill: INK });
    });
    el("chSkill").innerHTML = svg(W, H, g);
  }

  /* ---------- 口径 ---------- */
  function renderMethod() {
    let h = `<thead><tr><th style="width:120px">项目</th><th style="width:44px">标记</th>
             <th>来源与口径</th><th style="width:76px">状态</th></tr></thead><tbody>`;
    D.sources.forEach(s => {
      const b = s.s === "ok" ? '<span class="badge b-ok">可用</span>'
                             : '<span class="badge b-no">未用</span>';
      h += `<tr><td><b>${s.k}</b></td>
        <td style="text-align:center;font-size:14px;color:${s.kind === "●" ? TEAL : s.kind === "▲" ? GOLD : BLUE}">${s.kind}</td>
        <td>${s.v}</td><td>${b}</td></tr>`;
    });
    el("srcTable").innerHTML = h + "</tbody>";

    let g2 = `<thead><tr><th style="width:20%">缺口</th><th>说明</th></tr></thead><tbody>`;
    D.gaps.forEach(x => {
      g2 += `<tr><td><b>${x.k}</b></td><td>${x.v}</td></tr>`;
    });
    el("gapTb").innerHTML = g2 + "</tbody>";
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
      if (v === "majors") renderMajorTable();
    }
    btns.forEach(b => b.addEventListener("click", () => go(b.dataset.v)));
    const hash = (location.hash || "").replace("#", "");
    if (hash && document.getElementById("v-" + hash)) go(hash);
    window.go = go;
  }

  function boot() {
    renderKpis();
    renderLegend();
    renderMini(D.industries.find(x => x.key), "chFin", RED);
    renderAccMini();
    renderLine();
    renderBar();
    renderCufeInd();
    renderRegion();
    renderFlow();
    renderSubj();
    renderCufeFlow();
    renderTracks();
    renderMajors();
    renderMajorTable();
    renderDeg();
    renderYr();
    renderDir();
    renderPlan();
    renderFee();
    renderFamilies();
    renderSkills();
    renderPaths();
    renderExits();
    renderSchool();
    renderAi();
    renderSkillChart();
    renderMethod();
    initNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

