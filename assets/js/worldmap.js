// Interactive SVG World Collaboration & Visiting Network Map
(function () {
const CONTINENT_POLYGONS = [
  // North & Central America
  [[-168, 66], [-145, 70], [-125, 70], [-95, 72], [-75, 65], [-55, 52], [-66, 44], [-75, 35], [-81, 25], [-88, 21], [-83, 10], [-78, 8], [-85, 11], [-94, 15], [-105, 19], [-112, 24], [-117, 32], [-124, 42], [-132, 54], [-152, 60], [-166, 60]],
  // Greenland
  [[-52, 60], [-42, 60], [-22, 70], [-18, 81], [-45, 83], [-68, 77], [-56, 68]],
  // South America
  [[-78, 9], [-72, 12], [-61, 10], [-50, 1], [-35, -6], [-38, -14], [-41, -22], [-52, -33], [-62, -41], [-67, -54], [-74, -52], [-75, -40], [-71, -30], [-70, -18], [-81, -5], [-79, 2]],
  // Europe
  [[-9, 37], [-9, 43], [-2, 43], [-4, 48], [2, 51], [8, 54], [10, 58], [5, 61], [15, 69], [28, 71], [42, 67], [55, 66], [58, 54], [42, 43], [29, 41], [24, 38], [18, 40], [15, 38], [12, 43], [5, 43], [0, 38], [-5, 36]],
  // UK & Ireland
  [[-6, 50], [1, 51], [-1, 58], [-6, 58], [-8, 54]],
  // Africa
  [[-17, 15], [-13, 28], [-6, 36], [10, 37], [25, 32], [33, 31], [43, 12], [51, 12], [44, 2], [40, -11], [35, -25], [20, -35], [15, -26], [12, -16], [9, -2], [2, 5], [-8, 5], [-16, 11]],
  // Asia
  [[27, 41], [42, 43], [55, 52], [65, 68], [95, 75], [135, 72], [172, 66], [160, 55], [142, 52], [135, 40], [122, 38], [122, 25], [108, 16], [104, 2], [98, 10], [88, 22], [78, 8], [72, 20], [60, 25], [48, 30], [36, 32], [35, 37]],
  // Japan
  [[130, 31], [136, 34], [141, 38], [145, 44], [140, 44], [136, 37], [131, 34]],
  // Australia & New Zealand
  [[114, -22], [124, -15], [136, -12], [142, -11], [153, -25], [150, -37], [138, -35], [128, -32], [115, -34]],
  [[167, -46], [174, -41], [178, -37], [173, -35], [171, -42]]
];

const SVG_WIDTH = 960;
const SVG_HEIGHT = 460;

function project(lon, lat) {
  const x = ((lon + 180) / 360) * SVG_WIDTH;
  const y = ((90 - lat) / 180) * SVG_HEIGHT;
  return [x, y];
}

function escapeText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function typeMeta(type) {
  switch (type) {
    case 'hub':
      return { color: '#10b981', label: 'Home Research Hub', badge: 'badge-emerald' };
    case 'visiting':
      return { color: '#f5a623', label: 'Visiting Scientist', badge: 'badge-gold' };
    default:
      return { color: '#00d4ff', label: 'Collaboration / Conference', badge: 'badge-cyan' };
  }
}

function renderWorldMap(container, nodes, arcs) {
  if (!container || !Array.isArray(nodes) || nodes.length === 0) return;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let activeFilter = 'all';
  let selectedId = nodes[0].id;

  container.innerHTML = `
    <div class="map-header">
      <div>
        <h3 style="margin:0; font-family:var(--font-display); font-size:1.25rem;">Global Collaboration & Visiting Network</h3>
        <div class="map-legend" style="margin-top:0.4rem;">
          <span><i class="legend-dot" style="background:#10b981;"></i>Home Hubs (Córdoba & La Serena)</span>
          <span><i class="legend-dot" style="background:#f5a623;"></i>Visiting Scientist Appointments</span>
          <span><i class="legend-dot" style="background:#00d4ff;"></i>Research Collaborations & Workshops</span>
        </div>
      </div>
      <div class="filter-bar" style="margin-bottom:0;" role="tablist" aria-label="Filter network nodes">
        <button class="filter-pill active" data-map-filter="all">All (${nodes.length})</button>
        <button class="filter-pill" data-map-filter="hub">Hubs</button>
        <button class="filter-pill" data-map-filter="visiting">Visiting</button>
        <button class="filter-pill" data-map-filter="collaboration">Collaborations</button>
      </div>
    </div>
    <div class="map-layout">
      <div class="map-canvas-box">
        <svg class="world-map-svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-label="Interactive map of global scientific collaborations">
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.7" />
              <stop offset="50%" stop-color="#00d4ff" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#f5a623" stop-opacity="0.7" />
            </linearGradient>
          </defs>
          <g class="map-graticule" stroke="rgba(148,163,184,0.10)" stroke-width="0.8">
            ${[-60, -30, 0, 30, 60].map((lat) => {
              const [, y] = project(0, lat);
              return `<line x1="0" y1="${y.toFixed(1)}" x2="${SVG_WIDTH}" y2="${y.toFixed(1)}" stroke-dasharray="3 4" />`;
            }).join('')}
            ${[-120, -60, 0, 60, 120].map((lon) => {
              const [x] = project(lon, 0);
              return `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${SVG_HEIGHT}" stroke-dasharray="3 4" />`;
            }).join('')}
          </g>
          <g class="map-continents" fill="rgba(148,163,184,0.16)" stroke="rgba(148,163,184,0.28)" stroke-width="0.9">
            ${CONTINENT_POLYGONS.map((poly) => {
              const pts = poly.map(([lon, lat]) => {
                const [x, y] = project(lon, lat);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              return `<polygon points="${pts}" />`;
            }).join('')}
          </g>
          <g class="map-arcs" fill="none"></g>
          <g class="map-nodes"></g>
        </svg>
      </div>
      <div class="map-detail-panel" aria-live="polite"></div>
    </div>
  `;

  const arcsGroup = container.querySelector('.map-arcs');
  const nodesGroup = container.querySelector('.map-nodes');
  const detailPanel = container.querySelector('.map-detail-panel');
  const filterBtns = container.querySelectorAll('[data-map-filter]');

  function draw() {
    const visibleNodes = activeFilter === 'all'
      ? nodes
      : nodes.filter((n) => n.type === activeFilter);
    const visibleSet = new Set(visibleNodes.map((n) => n.id));

    if (!visibleSet.has(selectedId) && visibleNodes.length > 0) {
      selectedId = visibleNodes[0].id;
    }

    arcsGroup.innerHTML = (arcs || []).map((arc) => {
      const from = nodeMap.get(arc.from);
      const to = nodeMap.get(arc.to);
      if (!from || !to) return '';
      const active = activeFilter === 'all' || visibleSet.has(arc.to) || visibleSet.has(arc.from);
      if (!active) return '';
      const [x1, y1] = project(from.lon, from.lat);
      const [x2, y2] = project(to.lon, to.lat);
      const mx = (x1 + x2) / 2;
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const my = Math.min(y1, y2) - Math.min(72, dist * 0.24);
      const isHighlighted = selectedId === arc.from || selectedId === arc.to;
      return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}"
        stroke="url(#arcGrad)"
        stroke-width="${isHighlighted ? 2 : 1.15}"
        stroke-opacity="${isHighlighted ? 0.9 : 0.36}"
        stroke-dasharray="${isHighlighted ? 'none' : '4 4'}" />`;
    }).join('');

    nodesGroup.innerHTML = visibleNodes.map((node) => {
      const [x, y] = project(node.lon, node.lat);
      const meta = typeMeta(node.type);
      const isSelected = node.id === selectedId;
      const r = node.type === 'hub' ? 6.5 : 4.8;
      return `
        <g class="map-node-btn" data-node-id="${escapeText(node.id)}" tabindex="0" role="button" aria-label="${escapeText(node.city)}, ${escapeText(node.country)}">
          ${node.type === 'hub' || isSelected ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 6).toFixed(1)}" fill="${meta.color}" fill-opacity="0.22" />` : ''}
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isSelected ? (r + 1.5).toFixed(1) : r}" fill="${meta.color}" stroke="#050814" stroke-width="1.4" />
          <title>${escapeText(node.city)} (${escapeText(node.country)}) — ${escapeText(node.institution)}</title>
        </g>
      `;
    }).join('');

    const selected = nodeMap.get(selectedId) || visibleNodes[0];
    if (selected) {
      const meta = typeMeta(selected.type);
      detailPanel.innerHTML = `
        <div>
          <span class="badge ${meta.badge}">${escapeText(meta.label)}</span>
          <h4 style="margin:0.65rem 0 0.2rem; font-family:var(--font-display); font-size:1.18rem;">
            ${escapeText(selected.city)}, ${escapeText(selected.country)}
          </h4>
          <div style="font-size:0.86rem; font-weight:600; color:var(--accent-cyan); margin-bottom:0.35rem;">
            ${escapeText(selected.institution)}
          </div>
          <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-gold); margin-bottom:0.65rem;">
            ${escapeText(selected.years)}
          </div>
          <p style="margin:0; font-size:0.87rem; color:var(--text-secondary);">
            ${escapeText(selected.description)}
          </p>
        </div>
        <div style="border-top:1px solid var(--border-subtle); padding-top:0.75rem;">
          <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted); margin-bottom:0.45rem;">
            SELECT NODE TO INSPECT
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.35rem; max-height:110px; overflow-y:auto;">
            ${visibleNodes.map((n) => `
              <button type="button" class="filter-pill ${n.id === selected.id ? 'active' : ''}" data-pick-node="${escapeText(n.id)}" style="padding:0.22rem 0.56rem; font-size:0.75rem;">
                ${escapeText(n.city)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.mapFilter;
      filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      draw();
    });
  });

  container.addEventListener('click', (e) => {
    const nodeTarget = e.target.closest('[data-node-id]');
    const pickTarget = e.target.closest('[data-pick-node]');
    const id = nodeTarget?.dataset.nodeId || pickTarget?.dataset.pickNode;
    if (id && nodeMap.has(id)) {
      selectedId = id;
      draw();
    }
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const nodeTarget = e.target.closest('[data-node-id]');
      if (nodeTarget && nodeMap.has(nodeTarget.dataset.nodeId)) {
        e.preventDefault();
        selectedId = nodeTarget.dataset.nodeId;
        draw();
      }
    }
  });

  draw();
  }

  window.MardomSite = window.MardomSite || {};
  window.MardomSite.renderWorldMap = renderWorldMap;
})();
