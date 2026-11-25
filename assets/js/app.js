(function () {
  const { initStarfield, renderWorldMap } = window.MardomSite || {};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightOwnerName(authorsText) {
  const escaped = escapeHtml(authorsText);
  return escaped.replace(
    /(Domínguez Romero, M\. J\. de L\.|Domínguez Romero, M\. J\.|Domínguez, M\. J\. de L\.|Domínguez, M\. J\.|Domínguez, M\.)/g,
    '<strong>$1</strong>'
  );
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch {
    showToast('Copy not supported in this browser.');
  }
  document.body.removeChild(area);
}

function buildBibtex(pub) {
  const safeKey = (pub.id || `dominguez${pub.year}`).replace(/[^a-zA-Z0-9_-]/g, '');
  const lines = [
    `@article{${safeKey},`,
    `  author  = {${pub.authors}},`,
    `  title   = {{${pub.title}}},`,
    `  journal = {${pub.venue}},`,
    `  year    = {${pub.year}},`,
  ];
  if (pub.details) lines.push(`  note    = {${pub.details}},`);
  if (pub.doi) lines.push(`  doi     = {${pub.doi}},`);
  if (pub.arxiv) lines.push(`  eprint  = {${pub.arxiv}},`);
  lines.push('}');
  return lines.join('\n');
}

function initTheme() {
  const saved = localStorage.getItem('mardom-theme');
  const initial = saved === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', initial);
  updateThemeIcon(initial);

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mardom-theme', next);
      updateThemeIcon(next);
      window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    });
  }
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark observatory theme' : 'Switch to light theme');
  btn.innerHTML = theme === 'light'
    ? '<span aria-hidden="true">🌙</span>'
    : '<span aria-hidden="true">☀️</span>';
}

function initNavigation() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const sections = document.querySelectorAll('main section[id]');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window && sections.length && links.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((sec) => spy.observe(sec));
  }
}

function observeReveals() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  items.forEach((el) => obs.observe(el));
}

function renderHero(profile) {
  const heroEl = document.getElementById('hero-content');
  if (!heroEl) return;

  const links = profile.links || {};
  const socialLinks = [
    links.orcid ? { label: `ORCID ${links.orcid_id || ''}`.trim(), url: links.orcid } : null,
    links.github ? { label: 'GitHub @mardom', url: links.github } : null,
    links.twitter ? { label: `X / Twitter ${links.twitter_handle || ''}`.trim(), url: links.twitter } : null,
    links.talasa ? { label: 'TALASA', url: links.talasa } : null,
    links.ads ? { label: 'NASA/ADS', url: links.ads } : null,
    links.software_review ? { label: 'Software Stack Review', url: links.software_review } : null,
    links.google_scholar ? { label: 'Google Scholar', url: links.google_scholar } : null,
    links.researchgate ? { label: 'ResearchGate', url: links.researchgate } : null,
    links.linkedin ? { label: 'LinkedIn', url: links.linkedin } : null,
  ].filter(Boolean);

  const reviewLink = links.software_review || 'https://mardom.github.io/software-astronomical-stack/';
  const portraitSrc = profile.photo || 'assets/images/profile.jpg';

  heroEl.innerHTML = `
    <div class="hero-grid">
      <div>
        <div class="hero-badge">
          <span class="pulse-dot" aria-hidden="true"></span>
          <span>${escapeHtml(profile.coordinates_badge)}</span>
        </div>
        <h1 class="hero-title">${escapeHtml(profile.name)}</h1>
        <div class="hero-titles-list">
          ${(profile.titles || []).map((t, idx) => `
            <span class="role-pill ${idx === 3 ? 'highlight' : ''}">${escapeHtml(t)}</span>
          `).join('')}
        </div>
        <div class="hero-bio">
          ${(profile.bio_paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
        <div class="hero-cta-row">
          <a href="#connect" class="btn btn-primary">Schedule / Connect</a>
          <a href="${escapeHtml(reviewLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-gold">Astrophysical Software Review ↗</a>
          <a href="#applied-ml" class="btn btn-outline">Applied ML &amp; HPC</a>
          <a href="#publications" class="btn btn-outline">Publications</a>
          ${profile.cv_pdf ? `<a href="${escapeHtml(profile.cv_pdf)}" class="btn btn-outline" download>Download CV (PDF)</a>` : ''}
        </div>
        <div class="interests-row" aria-label="Research interests">
          ${(profile.research_interests || []).map((item) => `<span class="interest-chip">${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>

      <div class="hero-visual">
        <div class="portrait-frame">
          <div class="portrait-inner">
            <img id="hero-portrait-img" src="${escapeHtml(portraitSrc)}" alt="${escapeHtml(profile.name)}" onerror="this.onerror=null;this.src='assets/images/hero-observatory.svg';" />
          </div>
        </div>
        <div class="quick-links-bar">
          ${socialLinks.map((s) => `
            <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
              ${escapeHtml(s.label)}
            </a>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="metrics-grid">
      ${(profile.metrics || []).map((m) => `
        <div class="metric-card">
          <div class="metric-value">${escapeHtml(m.value)}</div>
          <div class="metric-label">${escapeHtml(m.label)}</div>
        </div>
      `).join('')}
    </div>

    <div class="card news-strip">
      <div class="news-strip-header">
        <span>Recent Activity &amp; Milestones</span>
        <span>2025 – 2026</span>
      </div>
      <div class="news-grid">
        ${(profile.news || []).map((n) => `
          <div class="news-item">
            <div class="news-meta">${escapeHtml(n.date)} · ${escapeHtml(n.tag)}</div>
            <div>${escapeHtml(n.text)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMissionsSection(missionsData) {
  const container = document.getElementById('missions-container');
  const mapContainer = document.getElementById('world-map-container');
  if (!container) return;

  const missions = missionsData.missions || [];
  let filter = 'all';

  const categories = [
    { key: 'all', label: `All (${missions.length})` },
    { key: 'active', label: 'Active Missions & Surveys' },
    { key: 'consortia', label: 'International Consortia' },
    { key: 'heritage', label: 'Heritage & Multi-Messenger' },
  ];

  function draw() {
    const shown = filter === 'all' ? missions : missions.filter((m) => m.category === filter);
    container.innerHTML = `
      <div class="filter-bar" role="tablist" aria-label="Filter missions by category">
        ${categories.map((c) => `
          <button type="button" class="filter-pill ${filter === c.key ? 'active' : ''}" data-mission-filter="${escapeHtml(c.key)}">
            ${escapeHtml(c.label)}
          </button>
        `).join('')}
      </div>
      <div class="missions-grid">
        ${shown.map((m) => `
          <article class="card mission-card" data-accent="${escapeHtml(m.accent || 'cyan')}">
            <div class="mission-top">
              <h3 class="mission-title">${escapeHtml(m.name)}</h3>
              <span class="badge">${escapeHtml(m.period)}</span>
            </div>
            <div class="mission-role">${escapeHtml(m.role)}</div>
            <p class="mission-summary">${escapeHtml(m.summary)}</p>
            <ul class="mission-highlights">
              ${(m.highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
            ${Array.isArray(m.sub_collaborations) && m.sub_collaborations.length ? `
              <div class="tags-row">
                ${m.sub_collaborations.map((sc) => `<span class="tag">${escapeHtml(sc)}</span>`).join('')}
              </div>
            ` : ''}
            ${(m.url || m.secondary_url || m.status_note) ? `
              <div style="margin-top:auto; padding-top:0.35rem; display:flex; flex-wrap:wrap; gap:0.45rem; align-items:center;">
                ${m.url ? `<a href="${escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">${escapeHtml(m.url_label || 'Mission / Portal ↗')}</a>` : ''}
                ${m.secondary_url ? `<a href="${escapeHtml(m.secondary_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">${escapeHtml(m.secondary_label || 'Details ↗')}</a>` : ''}
                ${m.status_note ? `<span class="badge badge-gold">${escapeHtml(m.status_note)}</span>` : ''}
              </div>
            ` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mission-filter]');
    if (!btn) return;
    filter = btn.dataset.missionFilter;
    draw();
  });

  draw();
  if (mapContainer) {
    renderWorldMap(mapContainer, missionsData.network_nodes || [], missionsData.network_arcs || []);
  }
}

function renderSoftwareSection(softwareData, profile) {
  const container = document.getElementById('software-container');
  if (!container) return;

  const review = softwareData.featured_review || {};
  const packages = softwareData.packages || [];
  const fallbackGithub = profile?.links?.github || 'https://github.com/mardom';

  container.innerHTML = `
    <article class="card review-hero">
      <div class="review-top">
        <div>
          <span class="badge badge-cyan">${escapeHtml(review.status || 'Active Review')}</span>
          <h3 style="font-family:var(--font-display); font-size:clamp(1.35rem,2.4vw,1.85rem); margin:0.55rem 0 0.3rem;">
            ${escapeHtml(review.title)}
          </h3>
          <div style="color:var(--accent-gold); font-weight:500; font-size:0.96rem;">
            ${escapeHtml(review.subtitle)}
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.55rem;">
          ${review.docs_url
            ? `<a href="${escapeHtml(review.docs_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-gold btn-sm">Open Live Review ↗</a>`
            : ''}
          ${review.repo_url
            ? `<a href="${escapeHtml(review.repo_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Review Repository ↗</a>`
            : `<a href="${escapeHtml(fallbackGithub)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Follow on GitHub ↗</a>`}
        </div>
      </div>

      <p style="color:var(--text-secondary); margin:0 0 1rem; max-width:85ch;">
        ${escapeHtml(review.summary)}
      </p>

      <div class="tags-row" style="margin-bottom:0.8rem;">
        <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted); align-self:center;">Participating Institutions:</span>
        ${(review.collaborators || []).map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join('')}
      </div>

      <div class="review-pillars">
        ${(review.pillars || []).map((p) => `
          <div class="pillar-card">
            <h4>${escapeHtml(p.title)}</h4>
            <p>${escapeHtml(p.description)}</p>
          </div>
        `).join('')}
      </div>

      <div class="roadmap-bar">
        ${(review.roadmap || []).map((step) => `
          <span class="roadmap-step ${escapeHtml(step.state || '')}">
            ${step.state === 'done' ? '✓' : step.state === 'active' ? '●' : '○'} ${escapeHtml(step.stage)}
          </span>
        `).join('')}
      </div>
    </article>

    <h3 style="font-family:var(--font-display); font-size:1.35rem; margin:0 0 1rem;">
      Open-Source Astrophysical Software &amp; Pipelines
    </h3>
    <div class="software-grid">
      ${packages.map((pkg) => `
        <article class="card software-card">
          <div>
            <div class="software-title-row">
              <h4 class="software-name">${escapeHtml(pkg.name)}</h4>
              <span class="badge ${pkg.featured ? 'badge-gold' : ''}">${escapeHtml(pkg.year)}</span>
            </div>
            <div style="font-size:0.84rem; font-weight:600; color:var(--accent-cyan); margin:0.25rem 0 0.55rem;">
              ${escapeHtml(pkg.tagline)}
            </div>
            <p style="margin:0 0 0.8rem; font-size:0.88rem; color:var(--text-secondary);">
              ${escapeHtml(pkg.description)}
            </p>
            <div class="tags-row">
              <span class="tag">${escapeHtml(pkg.language)}</span>
              ${(pkg.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
          <div>
            <div style="font-family:var(--font-mono); font-size:0.74rem; color:var(--text-muted); margin-bottom:0.55rem;" data-gh-meta="${escapeHtml(pkg.github_repo || '')}">
              ${escapeHtml(pkg.venue)}
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
              ${pkg.repo_url ? `<a href="${escapeHtml(pkg.repo_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Code / Repo ↗</a>` : ''}
              ${pkg.paper_url ? `<a href="${escapeHtml(pkg.paper_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Paper ↗</a>` : ''}
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  enrichGitHubMetadata(packages);
}

async function enrichGitHubMetadata(packages) {
  const repos = packages.map((p) => p.github_repo).filter(Boolean);
  for (const repo of repos) {
    const cacheKey = `gh-meta-${repo}`;
    let data = null;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        data = JSON.parse(cached);
      } else {
        const res = await fetch(`https://api.github.com/repos/${repo}`);
        if (res.ok) {
          const json = await res.json();
          data = { stars: json.stargazers_count, forks: json.forks_count };
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      }
      if (data && typeof data.stars === 'number') {
        const el = document.querySelector(`[data-gh-meta="${CSS.escape(repo)}"]`);
        if (el) {
          el.textContent = `${el.textContent} · ★ ${data.stars}`;
        }
      }
    } catch {
      // Silently ignore offline / rate-limit errors
    }
  }
}

function renderPublicationsSection(pubData) {
  const container = document.getElementById('publications-container');
  if (!container) return;

  const allPubs = pubData.publications || [];
  const pubMap = new Map(allPubs.map((p) => [p.id, p]));
  const topics = ['All', 'Featured', 'Submitted', 'AI/ML & Astrostatistics', 'Software & Surveys', 'Dark Matter & Cosmology', 'Multi-Messenger & Lensing', 'Galaxy Systems & 21cm'];
  const years = [...new Set(allPubs.map((p) => p.year))].sort((a, b) => b - a);

  let activeTopic = 'All';
  let activeYear = 'all';
  let query = '';

  container.innerHTML = `
    <div class="pub-controls">
      <div class="search-input-wrap">
        <input id="pub-search" type="search" class="input-control" placeholder="Search by title, author, venue, DOI, or arXiv ID..." aria-label="Search publications" />
      </div>
      <select id="pub-year" class="select-control" aria-label="Filter by year">
        <option value="all">All Years</option>
        ${years.map((y) => `<option value="${y}">${y}</option>`).join('')}
      </select>
    </div>
    <div class="filter-bar" id="pub-topic-bar" role="tablist" aria-label="Filter publications by topic">
      ${topics.map((t) => `
        <button type="button" class="filter-pill ${t === 'All' ? 'active' : ''}" data-pub-topic="${escapeHtml(t)}">
          ${escapeHtml(t)}
        </button>
      `).join('')}
    </div>
    <div class="pub-count-bar" id="pub-count-bar"></div>
    <div class="pub-list" id="pub-list"></div>
  `;

  const searchInput = document.getElementById('pub-search');
  const yearSelect = document.getElementById('pub-year');
  const topicBar = document.getElementById('pub-topic-bar');
  const countBar = document.getElementById('pub-count-bar');
  const listEl = document.getElementById('pub-list');

  function updateList() {
    const q = query.trim().toLowerCase();
    const filtered = allPubs.filter((p) => {
      if (activeYear !== 'all' && String(p.year) !== activeYear) return false;
      if (activeTopic === 'Featured' && !p.featured) return false;
      if (activeTopic === 'Submitted' && p.status !== 'submitted') return false;
      if (!['All', 'Featured', 'Submitted'].includes(activeTopic) && !(p.topics || []).includes(activeTopic)) return false;
      if (q) {
        const hay = `${p.title} ${p.authors} ${p.venue} ${p.doi || ''} ${p.arxiv || ''} ${p.year}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const summary = pubData.bibliometric_summary || {};
    countBar.textContent = `Showing ${filtered.length} of ${allPubs.length} publications · ${summary.source || 'NASA/ADS'}: h-index ${summary.h_index || 15}, ${summary.total_citations || '> 5,000'} citations`;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="card">No publications match your current filter. Try clearing the search box or switching topics.</div>`;
      return;
    }

    listEl.innerHTML = filtered.map((p) => `
      <article class="card pub-card ${p.featured ? 'featured-pub' : ''}">
        <div class="pub-meta-top">
          <span class="badge ${p.status === 'submitted' ? 'badge-violet' : 'badge-cyan'}">${p.status === 'submitted' ? 'Under Review' : escapeHtml(p.year)}</span>
          ${p.featured ? '<span class="badge badge-gold">Selected Highlight</span>' : ''}
          ${(p.topics || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <h3 class="pub-title">${escapeHtml(p.title)}</h3>
        <div class="pub-authors">${highlightOwnerName(p.authors)}</div>
        <div class="pub-venue">
          ${escapeHtml(p.venue)}${p.details ? ` · ${escapeHtml(p.details)}` : ''}
        </div>
        <div class="pub-actions">
          ${p.doi ? `<a href="https://doi.org/${escapeHtml(p.doi)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">DOI ↗</a>` : ''}
          ${p.arxiv ? `<a href="https://arxiv.org/abs/${escapeHtml(p.arxiv)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">arXiv:${escapeHtml(p.arxiv)} ↗</a>` : ''}
          ${p.code_url ? `<a href="${escapeHtml(p.code_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Code ↗</a>` : ''}
          <button type="button" class="btn btn-outline btn-sm" data-bibtex-id="${escapeHtml(p.id)}">Copy BibTeX</button>
        </div>
      </article>
    `).join('');
  }

  searchInput.addEventListener('input', (e) => {
    query = e.target.value;
    updateList();
  });

  yearSelect.addEventListener('change', (e) => {
    activeYear = e.target.value;
    updateList();
  });

  topicBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pub-topic]');
    if (!btn) return;
    activeTopic = btn.dataset.pubTopic;
    topicBar.querySelectorAll('.filter-pill').forEach((b) => b.classList.toggle('active', b === btn));
    updateList();
  });

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-bibtex-id]');
    if (!btn) return;
    const pub = pubMap.get(btn.dataset.bibtexId);
    if (pub) {
      copyToClipboard(buildBibtex(pub), 'BibTeX entry copied to clipboard');
    }
  });

  updateList();
}

function renderCareerSection(career) {
  const container = document.getElementById('career-container');
  if (!container) return;

  let activeTab = 'positions';
  const tabs = [
    { key: 'positions', label: 'Positions & Education' },
    { key: 'grants', label: 'Grants & Honors' },
    { key: 'governance', label: 'Governance, Evaluation & Visiting' },
  ];

  function renderBody() {
    if (activeTab === 'positions') {
      return `
        <div class="two-col-grid">
          <div>
            <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Academic &amp; Research Positions</h3>
            <div class="timeline">
              ${(career.positions || []).map((pos) => `
                <div class="card timeline-item ${pos.current ? 'current' : ''}">
                  <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.3rem;">
                    <span class="badge ${pos.current ? 'badge-emerald' : ''}">${escapeHtml(pos.period)}</span>
                    <span style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(pos.location)}</span>
                  </div>
                  <h4 style="margin:0.2rem 0; font-family:var(--font-display);">${escapeHtml(pos.role)}</h4>
                  <div style="font-size:0.88rem; color:var(--accent-cyan);">${escapeHtml(pos.institution)}</div>
                  ${pos.details ? `<p style="margin:0.4rem 0 0; font-size:0.84rem; color:var(--text-secondary);">${escapeHtml(pos.details)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Education &amp; Postdoctoral Training</h3>
            <div class="timeline" style="margin-bottom:2rem;">
              ${(career.education || []).map((edu) => `
                <div class="card timeline-item">
                  <span class="badge badge-gold">${escapeHtml(edu.period)}</span>
                  <h4 style="margin:0.4rem 0 0.2rem; font-family:var(--font-display);">${escapeHtml(edu.degree)}</h4>
                  <div style="font-size:0.88rem; color:var(--accent-cyan);">${escapeHtml(edu.institution)}</div>
                  ${edu.thesis ? `<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.35rem;"><strong>Thesis:</strong> ${escapeHtml(edu.thesis)}</div>` : ''}
                  ${edu.advisor ? `<div style="font-size:0.83rem; color:var(--text-muted); margin-top:0.2rem;"><strong>Advisor:</strong> ${escapeHtml(edu.advisor)}</div>` : ''}
                </div>
              `).join('')}
            </div>

            <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Professional Memberships</h3>
            <div class="card">
              <ul class="mission-highlights" style="font-size:0.88rem;">
                ${(career.memberships || []).map((m) => `<li>${escapeHtml(m)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    if (activeTab === 'grants') {
      return `
        <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Honors, Awards &amp; Distinctions</h3>
        <div class="three-col-grid" style="margin-bottom:2rem;">
          ${(career.honors || []).map((h) => `
            <article class="card">
              <span class="badge badge-gold">${escapeHtml(h.year)}</span>
              <h4 style="margin:0.55rem 0 0.35rem; font-family:var(--font-display);">${escapeHtml(h.title)}</h4>
              <p style="margin:0; font-size:0.86rem; color:var(--text-secondary);">${escapeHtml(h.body)}</p>
            </article>
          `).join('')}
        </div>

        <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Research Grants &amp; Funded Projects</h3>
        <div class="two-col-grid">
          ${(career.grants || []).map((g) => `
            <article class="card">
              <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem;">
                <span class="badge badge-cyan">${escapeHtml(g.period)}</span>
                ${g.funding ? `<span class="badge badge-emerald">${escapeHtml(g.funding)}</span>` : ''}
              </div>
              <h4 style="margin:0.25rem 0; font-family:var(--font-display);">${escapeHtml(g.title)}</h4>
              <div style="font-size:0.84rem; color:var(--accent-gold); font-weight:600; margin-bottom:0.25rem;">${escapeHtml(g.role)}</div>
              <div style="font-size:0.84rem; color:var(--accent-cyan); margin-bottom:0.35rem;">${escapeHtml(g.agency)}</div>
              <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(g.description)}</p>
            </article>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="two-col-grid">
        <div>
          <h3 style="font-family:var(--font-display); margin:0 0 1rem;">University Governance &amp; Scientific Committees</h3>
          <div style="display:flex; flex-direction:column; gap:0.85rem;">
            ${(career.governance || []).map((gov) => `
              <article class="card">
                <span class="badge badge-cyan">${escapeHtml(gov.period)}</span>
                <h4 style="margin:0.45rem 0 0.25rem; font-family:var(--font-display);">${escapeHtml(gov.body)}</h4>
                <div style="font-size:0.86rem; color:var(--accent-gold); font-weight:600;">${escapeHtml(gov.role)}</div>
                ${gov.details ? `<p style="margin:0.35rem 0 0; font-size:0.84rem; color:var(--text-secondary);">${escapeHtml(gov.details)}</p>` : ''}
              </article>
            `).join('')}
          </div>
        </div>
        <div>
          <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Visiting Scientist Appointments</h3>
          <div class="timeline" style="margin-bottom:2rem;">
            ${(career.visiting || []).map((v) => `
              <div class="card timeline-item">
                <span class="badge badge-gold">${escapeHtml(v.period)}</span>
                <h4 style="margin:0.35rem 0 0.2rem; font-family:var(--font-display); font-size:1rem;">${escapeHtml(v.institution)}</h4>
                <div style="font-size:0.84rem; color:var(--text-secondary);">${escapeHtml(v.location)}</div>
              </div>
            `).join('')}
          </div>

          <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Scientific Evaluation &amp; Peer Review</h3>
          <div style="display:flex; flex-direction:column; gap:0.85rem;">
            ${(career.evaluation || []).map((ev) => `
              <article class="card">
                <h4 style="margin:0 0 0.35rem; font-family:var(--font-display); color:var(--accent-cyan);">${escapeHtml(ev.category)}</h4>
                <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(ev.details)}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function draw() {
    container.innerHTML = `
      <div class="filter-bar" role="tablist" aria-label="Career sections">
        ${tabs.map((t) => `
          <button type="button" class="tab-btn ${activeTab === t.key ? 'active' : ''}" data-career-tab="${escapeHtml(t.key)}">
            ${escapeHtml(t.label)}
          </button>
        `).join('')}
      </div>
      <div>${renderBody()}</div>
    `;
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-career-tab]');
    if (!btn) return;
    activeTab = btn.dataset.careerTab;
    draw();
  });

  draw();
}

function renderAcademicSection(academic) {
  const container = document.getElementById('academic-container');
  if (!container) return;

  let activeTab = 'teaching';
  const tabs = [
    { key: 'teaching', label: 'Teaching & DiploDatos' },
    { key: 'mentoring', label: 'Mentoring & Theses' },
    { key: 'talks', label: 'Conferences & Talks' },
    { key: 'outreach', label: 'Outreach & Media' },
  ];

  function renderMentoringGroup(title, list) {
    return `
      <div style="margin-bottom:1.6rem;">
        <h4 style="font-family:var(--font-display); color:var(--accent-gold); margin:0 0 0.8rem;">${escapeHtml(title)}</h4>
        <div class="two-col-grid">
          ${(list || []).map((item) => `
            <article class="card">
              <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
                <strong>${escapeHtml(item.name)}</strong>
                <span class="badge">${escapeHtml(item.period)}</span>
              </div>
              <div style="font-size:0.83rem; color:var(--accent-cyan); margin:0.25rem 0;">${escapeHtml(item.affiliation)}</div>
              <p style="margin:0; font-size:0.84rem; color:var(--text-secondary);">${escapeHtml(item.topic)}</p>
              ${item.current_position ? `
                <div class="student-current-pos">
                  <span class="student-current-label">Current Position</span>
                  <div style="font-size:0.84rem; color:var(--text-primary);">${escapeHtml(item.current_position)}</div>
                  ${item.current_url ? `
                    <div>
                      <a href="${escapeHtml(item.current_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
                        ${escapeHtml(item.current_label || 'Current Profile ↗')}
                      </a>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderBody() {
    if (activeTab === 'teaching') {
      return `
        <div class="two-col-grid">
          ${(academic.teaching || []).map((course) => `
            <article class="card">
              <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.35rem;">
                <span class="badge badge-cyan">${escapeHtml(course.period)}</span>
                <span class="tag">${escapeHtml(course.hours)}</span>
              </div>
              <h4 style="margin:0.2rem 0; font-family:var(--font-display);">${escapeHtml(course.title)}</h4>
              <div style="font-size:0.84rem; color:var(--accent-gold); margin-bottom:0.35rem;">${escapeHtml(course.level)}</div>
              <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(course.details)}</p>
            </article>
          `).join('')}
        </div>
      `;
    }

    if (activeTab === 'mentoring') {
      const m = academic.mentoring || {};
      return `
        ${renderMentoringGroup('Postdoctoral Fellows & International Visiting Fellows', m.postdocs)}
        ${renderMentoringGroup('Ph.D. Theses & Graduate Internships', m.phd_and_grad)}
        ${renderMentoringGroup('Undergraduate Theses (Trabajos Finales de Licenciatura)', m.undergraduate)}
      `;
    }

    if (activeTab === 'talks') {
      return `
        <div style="margin-bottom:2rem;">
          <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Conference Organization &amp; Scientific Committees</h3>
          <div class="two-col-grid">
            ${(academic.conferences_organized || []).map((c) => `
              <article class="card">
                <span class="badge badge-gold">${escapeHtml(c.year)}</span>
                <h4 style="margin:0.45rem 0 0.25rem; font-family:var(--font-display);">${escapeHtml(c.name)}</h4>
                <div style="font-size:0.84rem; color:var(--accent-cyan);">${escapeHtml(c.location)}</div>
                <p style="margin:0.35rem 0 0; font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(c.role)}</p>
              </article>
            `).join('')}
          </div>
        </div>

        <div class="two-col-grid">
          <div>
            <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Invited Talks &amp; Seminars</h3>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${(academic.invited_talks || []).map((t) => `
                <article class="card" style="padding:1rem 1.15rem;">
                  <span class="badge badge-cyan">${escapeHtml(t.year)}</span>
                  <h4 style="margin:0.35rem 0 0.2rem; font-size:0.96rem; font-family:var(--font-display);">“${escapeHtml(t.title)}”</h4>
                  <div style="font-size:0.83rem; color:var(--text-secondary);">${escapeHtml(t.event)}</div>
                </article>
              `).join('')}
            </div>
          </div>
          <div>
            <h3 style="font-family:var(--font-display); margin:0 0 1rem;">Selected Contributed Talks &amp; Posters</h3>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${(academic.contributed_talks || []).map((t) => `
                <article class="card" style="padding:1rem 1.15rem;">
                  <span class="badge badge-violet">${escapeHtml(t.year)}</span>
                  <h4 style="margin:0.35rem 0 0.2rem; font-size:0.96rem; font-family:var(--font-display);">${escapeHtml(t.title)}</h4>
                  <div style="font-size:0.83rem; color:var(--text-secondary);">${escapeHtml(t.event)}</div>
                </article>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="three-col-grid">
        ${(academic.outreach || []).map((o) => `
          <article class="card">
            <span class="badge badge-gold">${escapeHtml(o.period)}</span>
            <h4 style="margin:0.55rem 0 0.35rem; font-family:var(--font-display);">${escapeHtml(o.title)}</h4>
            <p style="margin:0; font-size:0.86rem; color:var(--text-secondary);">${escapeHtml(o.details)}</p>
          </article>
        `).join('')}
      </div>
    `;
  }

  function draw() {
    container.innerHTML = `
      <div class="filter-bar" role="tablist" aria-label="Academic and outreach sections">
        ${tabs.map((t) => `
          <button type="button" class="tab-btn ${activeTab === t.key ? 'active' : ''}" data-acad-tab="${escapeHtml(t.key)}">
            ${escapeHtml(t.label)}
          </button>
        `).join('')}
      </div>
      <div>${renderBody()}</div>
    `;
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acad-tab]');
    if (!btn) return;
    activeTab = btn.dataset.acadTab;
    draw();
  });

  draw();
}

function buildCalendarEmbedUrl(baseEmbedUrl, mode) {
  try {
    const url = new URL(baseEmbedUrl);
    url.searchParams.set('mode', mode);
    return url.toString();
  } catch {
    return baseEmbedUrl;
  }
}

function renderConnectSection(profile) {
  const container = document.getElementById('connect-container');
  if (!container) return;

  const contact = profile.contact || {};
  const cal = profile.calendar || {};
  const links = profile.links || {};
  let calMode = cal.default_mode || 'MONTH';

  const email = contact.email || 'mariano.dominguez@unc.edu.ar';
  const emailList = Array.isArray(contact.emails) && contact.emails.length
    ? contact.emails
    : [{ address: email, label: 'Institutional Email' }];
  const mailtoSubject = encodeURIComponent('Collaboration / Research Inquiry');

  container.innerHTML = `
    <div class="connect-grid">
      <div class="card contact-row">
        <div>
          <h3 style="font-family:var(--font-display); margin:0 0 0.4rem;">Direct Contact &amp; Services</h3>
          <p style="margin:0; font-size:0.9rem; color:var(--text-secondary);">
            Reach out for Vera C. Rubin / LSST collaborations, MEROPE &amp; LINCC software partnerships, TALASA / ULS HPC &amp; AI initiatives, graduate supervision, or speaking invitations.
          </p>
        </div>

        <div class="contact-box">
          <div class="contact-label">Institutional Emails</div>
          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            ${emailList.map((em) => {
              const addr = em.address;
              const href = `mailto:${addr}?subject=${mailtoSubject}`;
              return `
                <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem;">
                  <div>
                    <a href="${escapeHtml(href)}" style="font-family:var(--font-mono); font-size:0.9rem;">${escapeHtml(addr)}</a>
                    ${em.label ? `<div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(em.label)}</div>` : ''}
                  </div>
                  <div style="display:flex; gap:0.45rem;">
                    <a href="${escapeHtml(href)}" class="btn btn-primary btn-sm">Send Email</a>
                    <button type="button" class="btn btn-outline btn-sm" data-copy-email="${escapeHtml(addr)}">Copy</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="contact-box">
          <div class="contact-label">Telephone</div>
          <div style="font-family:var(--font-mono); font-size:0.9rem;">${escapeHtml(contact.phone || '')}</div>
        </div>

        <div class="contact-box">
          <div class="contact-label">Institutional Affiliations</div>
          ${(contact.affiliations || []).map((a) => `
            <div style="margin-bottom:0.55rem;">
              <div style="font-weight:600; font-size:0.88rem;">${escapeHtml(a.institution)}</div>
              <div style="font-size:0.83rem; color:var(--text-secondary);">${escapeHtml(a.address)}</div>
            </div>
          `).join('')}
        </div>

        <div class="contact-box">
          <div class="contact-label">Code, Profiles &amp; Identifiers</div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.35rem;">
            ${links.github ? `<a href="${escapeHtml(links.github)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">GitHub ↗</a>` : ''}
            ${links.twitter ? `<a href="${escapeHtml(links.twitter)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">X / Twitter (${escapeHtml(links.twitter_handle || '')}) ↗</a>` : ''}
            ${links.talasa ? `<a href="${escapeHtml(links.talasa)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">TALASA ↗</a>` : ''}
            ${links.software_review ? `<a href="${escapeHtml(links.software_review)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Astrophysical Software Stack ↗</a>` : ''}
            ${links.orcid ? `<a href="${escapeHtml(links.orcid)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">ORCID ↗</a>` : ''}
            ${links.ads ? `<a href="${escapeHtml(links.ads)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">NASA/ADS ↗</a>` : ''}
            ${links.google_scholar ? `<a href="${escapeHtml(links.google_scholar)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Google Scholar ↗</a>` : ''}
            ${links.researchgate ? `<a href="${escapeHtml(links.researchgate)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">ResearchGate ↗</a>` : ''}
            ${links.linkedin ? `<a href="${escapeHtml(links.linkedin)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">LinkedIn ↗</a>` : ''}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="calendar-toolbar">
          <div>
            <h3 style="font-family:var(--font-display); margin:0;">Google Calendar &amp; Scheduling</h3>
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary);">
              Timezone: ${escapeHtml(cal.timezone || 'America/Argentina/Cordoba')}
            </div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.45rem; align-items:center;">
            <button type="button" class="filter-pill ${calMode === 'MONTH' ? 'active' : ''}" data-cal-mode="MONTH">Month</button>
            <button type="button" class="filter-pill ${calMode === 'WEEK' ? 'active' : ''}" data-cal-mode="WEEK">Week</button>
            <button type="button" class="filter-pill ${calMode === 'AGENDA' ? 'active' : ''}" data-cal-mode="AGENDA">Agenda</button>
            <a href="${escapeHtml(cal.booking_url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-gold btn-sm">Schedule a Meeting ↗</a>
          </div>
        </div>
        <div class="calendar-frame-wrap">
          <iframe
            id="google-calendar-frame"
            class="calendar-frame"
            title="Dr. Mariano Domínguez Romero Google Calendar"
            src="${escapeHtml(buildCalendarEmbedUrl(cal.embed_url || '', calMode))}"
            loading="lazy"
          ></iframe>
        </div>
        <p style="margin:0.75rem 0 0; font-size:0.8rem; color:var(--text-muted);">
          Note: Events appear in the embedded calendar when public visibility is enabled on Google Calendar, or you can use <strong>Schedule a Meeting</strong> above to send an invite directly to <code>${escapeHtml(email)}</code>.
        </p>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-copy-email]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addr = btn.dataset.copyEmail;
      if (addr) copyToClipboard(addr, `Copied ${addr}`);
    });
  });

  container.querySelectorAll('[data-cal-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      calMode = btn.dataset.calMode;
      container.querySelectorAll('[data-cal-mode]').forEach((b) => b.classList.toggle('active', b === btn));
      const frame = document.getElementById('google-calendar-frame');
      if (frame && cal.embed_url) {
        frame.src = buildCalendarEmbedUrl(cal.embed_url, calMode);
      }
    });
  });
}

function renderAppliedMLSection(showcase) {
  const container = document.getElementById('applied-ml-container');
  if (!container) return;

  const projects = showcase.applied_ml_projects || [];
  container.innerHTML = `
    <div class="ml-grid">
      ${projects.map((proj) => `
        <article class="card ml-card ${proj.featured ? 'featured-ml' : ''}">
          <div>
            <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem;">
              <span class="badge ${proj.featured ? 'badge-cyan' : ''}">${escapeHtml(proj.period)}</span>
              <span class="badge ${proj.featured ? 'badge-gold' : ''}">${escapeHtml(proj.status)}</span>
            </div>
            <h3 style="font-family:var(--font-display); font-size:1.15rem; margin:0.25rem 0 0.2rem;">
              ${escapeHtml(proj.title)}
            </h3>
            <div style="font-size:0.84rem; font-weight:600; color:var(--accent-gold); margin-bottom:0.5rem;">
              ${escapeHtml(proj.role)}
            </div>
            <p style="margin:0 0 0.85rem; font-size:0.88rem; color:var(--text-secondary);">
              ${escapeHtml(proj.description)}
            </p>
          </div>
          <div>
            <div class="tags-row" style="margin-bottom:${proj.url ? '0.65rem' : '0'};">
              ${(proj.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
            ${proj.url ? `<a href="${escapeHtml(proj.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Project / Paper ↗</a>` : ''}
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderPhotosSection(showcase) {
  const container = document.getElementById('photos-container');
  if (!container) return;

  const photos = showcase.photographs || [];
  const categories = ['All', ...new Set(photos.map((p) => p.category).filter(Boolean))];
  let activeCategory = 'All';

  const lightbox = document.getElementById('photo-lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbTitle = document.getElementById('lightbox-title');
  const lbDesc = document.getElementById('lightbox-desc');
  const lbClose = document.getElementById('lightbox-close');

  function closeLightbox() {
    if (lightbox) lightbox.hidden = true;
  }

  lbClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  function draw() {
    const shown = activeCategory === 'All'
      ? photos
      : photos.filter((p) => p.category === activeCategory);

    container.innerHTML = `
      <div class="filter-bar" role="tablist" aria-label="Filter photographs by category">
        ${categories.map((cat) => `
          <button type="button" class="filter-pill ${activeCategory === cat ? 'active' : ''}" data-photo-cat="${escapeHtml(cat)}">
            ${escapeHtml(cat)}
          </button>
        `).join('')}
      </div>
      <div class="photo-grid">
        ${shown.map((photo) => `
          <article class="card photo-card">
            <div class="photo-media">
              ${photo.image
                ? `<img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.title)}" data-lightbox-id="${escapeHtml(photo.id)}" loading="lazy" />`
                : `
                  <div class="photo-placeholder">
                    <span class="photo-placeholder-icon" aria-hidden="true">📷</span>
                    <span class="badge badge-cyan">${escapeHtml(photo.category)}</span>
                    <span style="font-family:var(--font-mono); font-size:0.74rem; color:var(--text-muted);">${escapeHtml(photo.location)}</span>
                  </div>
                `}
            </div>
            <div class="photo-body">
              <div style="display:flex; justify-content:space-between; gap:0.5rem; align-items:center;">
                <span class="badge">${escapeHtml(photo.category)}</span>
                <span style="font-family:var(--font-mono); font-size:0.74rem; color:var(--accent-gold);">${escapeHtml(photo.year)}</span>
              </div>
              <h3 style="font-family:var(--font-display); font-size:1.05rem; margin:0.25rem 0 0;">
                ${escapeHtml(photo.title)}
              </h3>
              <div style="font-size:0.8rem; color:var(--accent-cyan);">${escapeHtml(photo.location)}</div>
              <p style="margin:0.2rem 0 0; font-size:0.84rem; color:var(--text-secondary);">
                ${escapeHtml(photo.caption)}
              </p>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  container.addEventListener('click', (e) => {
    const catBtn = e.target.closest('[data-photo-cat]');
    if (catBtn) {
      activeCategory = catBtn.dataset.photoCat;
      draw();
      return;
    }
    const imgEl = e.target.closest('[data-lightbox-id]');
    if (imgEl && lightbox && lbImg && lbTitle && lbDesc) {
      const item = photos.find((p) => p.id === imgEl.dataset.lightboxId);
      if (item && item.image) {
        lbImg.src = item.image;
        lbImg.alt = item.title;
        lbTitle.textContent = `${item.title} — ${item.location}`;
        lbDesc.textContent = item.caption || '';
        lightbox.hidden = false;
      }
    }
  });

  draw();
}

async function fetchJson(path, key) {
  if (window.location.protocol === 'file:') {
    const bundled = window.__MARDOM_DATA__?.[key];
    if (bundled) return bundled;
    throw new Error(`Missing bundled offline data for ${key}`);
  }
  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Failed to load ${path} (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    const bundled = window.__MARDOM_DATA__?.[key];
    if (bundled) return bundled;
    throw err;
  }
}

async function bootstrap() {
  initTheme();
  initNavigation();
  if (typeof initStarfield === 'function') {
    initStarfield();
  }

  try {
    const [profile, missions, software, publications, career, academic, showcase] = await Promise.all([
      fetchJson('data/profile.json', 'profile'),
      fetchJson('data/missions.json', 'missions'),
      fetchJson('data/software.json', 'software'),
      fetchJson('data/publications.json', 'publications'),
      fetchJson('data/career.json', 'career'),
      fetchJson('data/academic.json', 'academic'),
      fetchJson('data/showcase.json', 'showcase'),
    ]);

    renderHero(profile);
    renderMissionsSection(missions);
    renderSoftwareSection(software, profile);
    renderAppliedMLSection(showcase);
    renderPublicationsSection(publications);
    renderCareerSection(career);
    renderAcademicSection(academic);
    renderPhotosSection(showcase);
    renderConnectSection(profile);

    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) {
      footerCopy.textContent = `© ${new Date().getFullYear()} ${profile.name} · Powered by clean JSON data on GitHub Pages`;
    }

    observeReveals();
  } catch (err) {
    const banner = document.getElementById('load-error');
    if (banner) {
      banner.hidden = false;
      banner.innerHTML = `
        <strong>Unable to load site data.</strong> ${escapeHtml(err.message)}.
        If you opened <code>index.html</code> directly via <code>file://</code>, serve the folder over HTTP (e.g., <code>python3 -m http.server 8000</code>).
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
})();
