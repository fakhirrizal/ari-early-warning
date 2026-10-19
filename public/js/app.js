/**
 * ARI - Main App
 * Chart: ApexCharts · Tables: DataTables · Select: Select2 · Format: IDR / date helpers
 */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Category → icon + tone (icons are the same glyphs used before)
const CAT = {
  LEGAL:       { icon: '⚖',  tone: 'violet' },
  FINANCIAL:   { icon: '₨',  tone: 'blue'   },
  OPERATIONAL: { icon: '⚙',  tone: 'amber'  },
  INDUSTRY:    { icon: '📊', tone: 'teal'   },
  NEWS:        { icon: '📰', tone: 'grey'   },
};

// Page header (hero) content
const PAGES = {
  dashboard:  { title: 'Executive Dashboard',            icon: '◫', sub: 'Truck Rental & Leasing · Receivables Early Warning' },
  analytics:  { title: 'Portfolio Analytics',            icon: '◷', sub: 'Aging, exposure and early-warning effectiveness' },
  customers:  { title: 'Customer Monitoring',            icon: '▤', sub: 'Search customers and open their risk profile' },
  risk:       { title: 'Internal Risk Assessment',       icon: '◈', sub: 'Rule-based behavioral scoring with AI explanation' },
  external:   { title: 'External Intelligence · Gemini AI', icon: '✦', sub: 'Public evidence found and analyzed by Gemini' },
  alerts:     { title: 'Alert Management',               icon: '◉', sub: 'Pre-due warnings, owners and lead time' },
  collection: { title: 'Collection Actions',             icon: '▣', sub: 'Record actions and follow evidence-based suggestions' },
  management: { title: 'Management Decision Support',    icon: '◇', sub: 'Human-approved decisions backed by risk summaries' },
  kpi:        { title: 'MVP KPI Dashboard',              icon: '◈', sub: 'Eight priority KPIs plus the precision guardrail' },
  sources:    { title: 'Data Sources & Configuration',   icon: '▤', sub: 'System architecture, approved sources and logs' },
};

const App = {
  currentPage: 'dashboard',
  assessment: null,
  selectedCustomerId: 'C001',
  selectedEvidenceId: 'EV-001',
  charts: {},
  dataTables: {},

  // =====================================================================
  // INIT
  // =====================================================================
  async init() {
    try {
      await ARIDB.init((pct, txt) => {
        const f = document.getElementById('loadFill');
        const t = document.getElementById('loadText');
        if (f) f.style.width = pct + '%';
        if (t) t.textContent = txt;
      });
      this.hideLoading();
      // Use a CSS class (not inline style) so the mobile layout rules can override it
      document.getElementById('app').classList.add('ready');
      this.bindNav();
      this.bindEvents();
      this.populateDropdowns();
      this.initEmptyStates();
      this.loadRiskInputs();
      this.renderAll();
      this.renderCharts();
    } catch (err) {
      console.error('Init error:', err);
      const t = document.getElementById('loadText');
      if (t) t.textContent = 'Error: ' + err.message;
    }
  },

  hideLoading() {
    const el = document.getElementById('loading');
    if (el) { el.classList.add('hide'); setTimeout(() => el.remove(), 400); }
  },

  initEmptyStates() {
    const set = (id, html) => { const el = document.getElementById(id); if (el && !el.innerHTML.trim()) el.innerHTML = html; };
    set('customerDetail',   this.empty('▤', 'No customer selected', 'Pick a customer from the table above and press <b>View</b>.'));
    set('customerExternal', this.empty('✦', 'No evidence to show yet', 'External signals for the selected customer will appear here.'));
    set('alertDetail',      this.empty('◉', 'No alert selected', 'Choose an alert from the table and press <b>Review</b>.'));
    set('collectionSuggest',this.empty('✦', 'Select an alert', 'The recommended next step appears here once an alert is chosen.'));
    set('riskResult',       this.empty('◈', 'Ready to assess', 'Select a customer and press <b>Calculate Risk</b>.'));
    set('riskExplanation',  '');
  },

  populateDropdowns() {
    const custs = ARIDB.query('SELECT * FROM customers');
    ['riskCustomer', 'mgrCustomer', 'scrapeCustSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = custs.map(c => `<option value="${c.id}">${this.esc(c.name)}</option>`).join('');
    });

    const alerts = ARIDB.query('SELECT * FROM alerts LIMIT 500');
    const names = {};
    custs.forEach(c => { names[c.id] = c.name; });
    const aa = document.getElementById('actionAlert');
    if (aa) aa.innerHTML = alerts.map(a =>
      `<option value="${a.id}">${a.id} — ${this.esc(names[a.customer_id] || '')}</option>`).join('');

    // Select2 — a dedicated hook class (js-select) avoids clashing with Select2's own .select2-dropdown
    $('.js-select').select2({
      width: '100%',
      allowClear: false,
      language: { noResults: () => 'No match found' },
    });
  },

  bindNav() {
    document.querySelectorAll('.nav').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.page));
    });
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === page));
    document.querySelectorAll('.nav').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const meta = PAGES[page] || { title: page, icon: '◫', sub: '' };
    document.getElementById('pageTitle').textContent = meta.title;
    document.getElementById('pageSub').textContent = meta.sub;
    document.getElementById('pageIcon').textContent = meta.icon;
    this.renderAll();
    if (['dashboard', 'analytics', 'kpi'].includes(page)) requestAnimationFrame(() => this.renderCharts());
    // keep the active chip visible in the mobile nav, and start every page at the top
    const active = document.querySelector('.nav.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  focusPanel(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = window.innerWidth <= 800 ? 128 : 20;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  },

  bindEvents() {
    $('#riskCustomer').on('change', () => this.loadRiskInputs());
    $('#mgrCustomer').on('change', () => this.renderManagement());
    $('#actionAlert').on('change', () => this.renderCollectionSuggest());

    document.getElementById('calcRiskBtn')?.addEventListener('click', () => this.calcRisk());
    document.getElementById('explainBtn')?.addEventListener('click', () => this.explainRisk());
    document.getElementById('saveActionBtn')?.addEventListener('click', () => this.saveAction());
    document.getElementById('saveReviewBtn')?.addEventListener('click', () => this.saveReview());
    document.getElementById('scrapeBtn')?.addEventListener('click', () => this.runScrape());
    document.getElementById('seedBtn')?.addEventListener('click', () => this.runBulkSeed());
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      if (confirm('Reset all data to initial seed?')) ARIDB.reset();
    });

    document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal')?.addEventListener('click', e => { if (e.target.id === 'modal') this.closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });

    // chips that jump to a piece of evidence (collection suggestion, customer card)
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-goto-ev]');
      if (!b) return;
      this.selectedEvidenceId = b.dataset.gotoEv;
      this.navigate('external');
      setTimeout(() => this.focusPanel('evidencePanel'), 250);
    });
  },

  // =====================================================================
  // MODAL (was referenced before but never defined)
  // =====================================================================
  openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    const m = document.getElementById('modal');
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  },
  closeModal() {
    const m = document.getElementById('modal');
    if (!m || !m.classList.contains('open')) return;
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  },

  // =====================================================================
  // BULK SEED + GEMINI SCRAPE
  // =====================================================================
  async runBulkSeed() {
    if (!confirm('Generate ~1000 customers + alerts + evidence?\n\nExisting data will be overwritten. Process ~3 seconds.')) return;
    this.toast('⚡ Generating 1000 records...', 'gemini');
    setTimeout(() => {
      try {
        const stats = ARIDB.seedBulk(() => {});
        this.toast(`✓ Seeded ${stats.customers} customers, ${stats.alerts} alerts, ${stats.evidence} evidence`, 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (e) {
        this.toast('✗ Seed failed: ' + e.message, 'error');
      }
    }, 100);
  },

  async runScrape() {
    const custId = $('#scrapeCustSelect').val();
    const cust = ARIDB.query('SELECT * FROM customers WHERE id=?', [custId])[0];
    if (!cust) return;
    const st = document.getElementById('scrapeStatus');
    const act = document.getElementById('aiActivityBox');
    const btn = document.getElementById('scrapeBtn');
    if (btn) btn.disabled = true;
    st.innerHTML = '<span class="ai-pulse">Gemini analyzing...</span>';
    if (act) act.innerHTML = `
      <div class="ai-card" style="margin-top:16px">
        <div class="ai-pulse">Gemini AI is working</div>
        <div class="kv" style="margin-top:12px">
          <div><div class="k">Customer</div><div class="v">${this.esc(cust.name)}</div></div>
          <div><div class="k">Model</div><div class="v">gemini-3.8-flash</div></div>
          <div><div class="k">Looking at</div><div class="v">SIPP, IDX, operational news</div></div>
        </div>
      </div>`;
    this.toast('✦ Calling Gemini AI...', 'gemini');

    const res = await ARIScraper.fetchEvidence(cust.name, msg => {
      const p = act?.querySelector('.ai-pulse');
      if (p) p.textContent = msg;
    });
    if (btn) btn.disabled = false;

    if (!res.success) {
      st.innerHTML = `<span style="color:var(--error)">✗ ${this.esc(res.error)}</span>`;
      if (act) act.innerHTML = `<div class="box warn">Error: ${this.esc(res.error)}</div>`;
      this.toast('✗ Gemini error: ' + res.error, 'error');
      return;
    }

    res.evidence.forEach((ev, i) => {
      if (ev.error) return;
      const id = 'EV-G' + Date.now() + '-' + i;
      ARIDB.exec(
        `INSERT OR REPLACE INTO evidence(id,customer_id,source_id,event,category,severity,confidence,verified,match_status,score,published,available,summary,ai_provider) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, custId, ev.source_id || 'SRC-03', ev.event, ev.category || 'OPERATIONAL',
         ev.severity || 'Low', ev.confidence || 'Medium',
         (ev.confidence === 'High') ? 1 : 0, 'Matched',
         JSON.stringify(ev.score || [50, 50, 50, 50]),
         ev.published_at || new Date().toISOString().slice(0, 10),
         ev.first_available_at || new Date().toISOString().slice(0, 10),
         ev.summary || 'Gemini-generated evidence', 'gemini']
      );
    });

    st.innerHTML = `<span class="badge gemini">${res.total} evidence via Gemini</span> <span class="muted">(${res.duration}ms)</span>`;
    if (act) act.innerHTML = `
      <div class="ai-card" style="margin-top:16px">
        <div class="chips" style="margin-bottom:10px">
          <span class="badge gemini">Gemini success</span>
          <span class="chip tone-grey">${res.duration}ms</span>
          <span class="chip tone-grey">mode: ${this.esc(res.mode || 'analysis')}</span>
        </div>
        <div><b>${res.total} evidence</b> found for <b>${this.esc(cust.name)}</b>.</div>
        <div class="muted" style="margin-top:4px">Model: <code>${this.esc(res.model || 'gemini-3.8-flash')}</code></div>
      </div>`;
    this.toast(`✦ Gemini found ${res.total} evidence (${res.duration}ms)`, 'gemini');
    this.renderExternal();
  },

  // =====================================================================
  // DATATABLE WRAPPER
  //   cell may be a string, or {html, order} to control sorting (e.g. dates)
  //   every <td> gets data-label so the table becomes stacked cards on mobile
  // =====================================================================
  renderDataTable(containerId, headers, rows, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (this.dataTables[containerId]) {
      try { this.dataTables[containerId].destroy(); } catch {}
      delete this.dataTables[containerId];
    }
    if (!rows.length) {
      container.innerHTML = this.empty('◷', 'Nothing here yet', options.emptyText || 'Records will appear here as soon as they are created.');
      return;
    }
    const labels = headers.map(h => String(h).replace(/<[^>]*>/g, ''));
    const td = (c, i) => {
      const obj = c && typeof c === 'object' && 'html' in c;
      const html = obj ? c.html : c;
      const ord = obj && c.order !== undefined ? ` data-order="${this.esc(c.order)}"` : '';
      return `<td data-label="${this.esc(labels[i])}"${ord}>${html}</td>`;
    };
    container.innerHTML = `
      <table class="display" style="width:100%">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map(td).join('')}</tr>`).join('')}</tbody>
      </table>`;
    const table = container.querySelector('table');
    if (!table || !window.DataTable) return;
    this.dataTables[containerId] = new DataTable(table, {
      pageLength: options.pageLength || 25,
      lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
      deferRender: true,
      order: options.order || [],
      language: {
        search: 'Search:', lengthMenu: 'Show _MENU_',
        info: 'Showing _START_–_END_ of _TOTAL_',
        infoEmpty: 'No data',
        infoFiltered: '(filtered from _MAX_ total)',
        zeroRecords: 'Not found',
        paginate: { first: 'First', last: 'Last', next: '›', previous: '‹' },
      },
      ...options,
    });
  },

  // =====================================================================
  // DASHBOARD
  // =====================================================================
  renderDashboard() {
    const custs = ARIDB.query('SELECT * FROM customers');
    const counts = { Green: 0, Yellow: 0, Red: 0, Insufficient: 0 };
    custs.forEach(c => counts[ARIRisk.fromCustomer(c).level]++);
    const totalExposure = custs.reduce((s, c) => s + c.exposure, 0);
    const ef = this.fmtIDRMetric(totalExposure);
    const num = v => `<div class="num"><span class="val">${v}</span></div>`;

    const metrics = [
      { label: 'Total Exposure', icon: '◫', tone: 'blue',
        html: `<div class="num ${ef.cls}" title="${ef.full}">${ef.html}</div>`, note: 'Outstanding customer exposure' },
      { label: 'Monitored Customers', icon: '▤', tone: 'teal',
        html: num(custs.length.toLocaleString('en-US')), note: 'Active customer portfolio' },
      { label: 'High-Risk Customers', icon: '◉', tone: 'red',
        html: num(counts.Red.toLocaleString('en-US')), note: 'Rule-based Red classification' },
      { label: 'Early Risk Detection', icon: '◈', tone: 'violet',
        html: num('60%'), note: 'Detection recall (K21)' },
      { label: 'Early Warning Lead Time', icon: '◷', tone: 'amber',
        html: num('7 days'), note: 'First alert before due (K24)' },
      { label: 'Alert Precision', icon: '✦', tone: 'green',
        html: num('50%'), note: 'Precision guardrail (K22)' },
    ];
    document.getElementById('mDashboard').innerHTML = metrics.map(m => this.metric(m)).join('');

    const sorted = [...custs].sort((a, b) =>
      (ARIRisk.fromCustomer(b).value ?? -1) - (ARIRisk.fromCustomer(a).value ?? -1)).slice(0, 10);

    this.renderDataTable('watchlist',
      ['Customer', 'Contract', 'Exposure', 'On-Time', 'Risk Score', 'Risk'],
      sorted.map(c => {
        const r = ARIRisk.fromCustomer(c);
        return [
          this.nameCell(c.name),
          c.contract,
          { html: this.fmtIDRShort(c.exposure), order: c.exposure },
          { html: c.rate + '%', order: c.rate },
          { html: this.scoreBar(r.value, r.level), order: r.value ?? -1 },
          this.badge(r.level),
        ];
      }),
      { pageLength: 10, lengthMenu: [[10, 25, -1], [10, 25, 'All']], order: [[4, 'desc']] }
    );
  },

  // =====================================================================
  // CUSTOMERS
  // =====================================================================
  renderCustomers() {
    const custs = ARIDB.query('SELECT * FROM customers');
    this.renderDataTable('customerTable',
      ['Customer', 'Contract', 'On-Time', 'Delay', 'Growth', 'Exposure', 'Risk', 'Action'],
      custs.map(c => {
        const r = ARIRisk.fromCustomer(c);
        return [
          this.nameCell(c.name),
          c.contract,
          { html: c.rate + '%', order: c.rate },
          { html: c.delay === null || c.delay === undefined ? 'N/A' : c.delay + ' d', order: c.delay ?? -1 },
          { html: c.growth + '%', order: c.growth },
          { html: this.fmtIDRShort(c.exposure), order: c.exposure },
          this.badge(r.level),
          `<button class="btn sm tonal" data-view-cust="${c.id}">View</button>`,
        ];
      }),
      { pageLength: 10, order: [[0, 'asc']] }
    );
    const wrapper = document.getElementById('customerTable');
    if (wrapper) {
      wrapper.onclick = (e) => {
        const btn = e.target.closest('[data-view-cust]');
        if (btn) { this.showCustomer(btn.dataset.viewCust); this.focusPanel('customerProfilePanel'); }
      };
    }
  },

  showCustomer(id) {
    this.selectedCustomerId = id;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    const r = ARIRisk.fromCustomer(c);
    const rateTone  = c.rate >= 95 ? 'green' : c.rate >= 80 ? 'amber' : 'red';
    const delayTone = c.delay === null || c.delay === undefined ? 'grey' : c.delay <= 2 ? 'green' : c.delay <= 5 ? 'amber' : 'red';
    const growTone  = c.growth <= 10 ? 'green' : c.growth <= 20 ? 'amber' : 'red';

    document.getElementById('customerDetail').innerHTML = `
      <div class="pcard">
        <div class="p-head">
          ${this.avatar(c.name, 'lg')}
          <div class="p-id">
            <h3>${this.esc(c.name)}</h3>
            <div class="chips">
              <span class="chip mono tone-blue">${this.esc(c.contract)}</span>
              <span class="chip tone-green">Active</span>
              ${this.badge(r.level)}
            </div>
          </div>
          ${this.gauge(r.value, r.level, 'risk score')}
        </div>
        <div class="tiles">
          ${this.tile('On-Time Rate', c.rate + '%', 'Settled on or before due', rateTone)}
          ${this.tile('Delay Trend', c.delay === null || c.delay === undefined ? 'N/A' : c.delay + ' days', 'Recent vs previous', delayTone)}
          ${this.tile('Exposure Growth', c.growth + '%', 'vs previous period', growTone)}
          ${this.tile('Exposure', this.fmtIDRShort(c.exposure), this.fmtIDR(c.exposure), 'blue')}
          ${this.tile('Next Due', this.fmtDate(c.due), (c.invoices || 0) + ' settled invoices', 'violet')}
        </div>
        <div class="p-actions"><button class="btn" id="goAssessBtn"><span class="ic">◈</span> Assess Risk</button></div>
      </div>`;
    document.getElementById('goAssessBtn')?.addEventListener('click', () => {
      this.navigate('risk');
      $('#riskCustomer').val(id).trigger('change');
    });

    const ev = ARIDB.query('SELECT * FROM evidence WHERE customer_id=?', [id]);
    const ext = ARIScraper.scoreExternal(ev);
    const latest = [...ev].sort((a, b) => String(b.published).localeCompare(String(a.published))).slice(0, 4);
    const rows = latest.map(e => {
      const cat = CAT[e.category] || { icon: '◆', tone: 'grey' };
      const st = this.evStatus(e);
      return `
        <div class="mrow tone-${cat.tone}">
          <span class="m-ic">${cat.icon}</span>
          <div><div class="t">${this.esc(e.event)}</div>
            <div class="s">${this.esc(e.category)} · ${this.esc(e.severity)} · ${this.fmtDate(e.published)}</div></div>
          <span class="chip tone-${st.tone}">${st.label}</span>
        </div>`;
    }).join('');
    document.getElementById('customerExternal').innerHTML = `
      <div class="pcard">
        <div class="p-head c2e">
          <div class="p-id">
            <h3>${this.esc(c.name)}</h3>
            <div class="chips">
              ${this.badge(ext.level)}
              <span class="chip tone-violet">${ev.length} evidence</span>
              <span class="chip tone-teal">${ext.evidence.length} verified</span>
            </div>
          </div>
          ${this.gauge(ext.value, ext.level, 'external')}
        </div>
        ${rows ? `<div class="mini-list">${rows}</div>` : this.empty('✦', 'No external evidence', 'Run “Fetch via Gemini AI” in External Intelligence to look for public signals.')}
        ${latest.length ? `<div class="p-actions"><button class="btn alt" data-goto-ev="${latest[0].id}">Open in External Intelligence</button></div>` : ''}
      </div>`;
  },

  // =====================================================================
  // INTERNAL RISK
  // =====================================================================
  loadRiskInputs() {
    const id = $('#riskCustomer').val();
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    document.getElementById('riskRate').value = c.rate;
    document.getElementById('riskDelay').value = c.delay ?? '';
    document.getElementById('riskGrowth').value = c.growth;
    document.getElementById('riskResult').innerHTML = this.empty('◈', 'Ready to assess', 'Press <b>Calculate Risk</b> to score this customer.');
    document.getElementById('riskExplanation').innerHTML = '';
    this.assessment = null;
  },

  calcRisk() {
    const id = $('#riskCustomer').val();
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    const out = document.getElementById('riskResult');
    const rate = document.getElementById('riskRate').value.trim();
    const delay = document.getElementById('riskDelay').value.trim();
    const growth = document.getElementById('riskGrowth').value.trim();
    this.assessment = null;
    document.getElementById('riskExplanation').innerHTML = '';
    if ([rate, delay, growth].some(v => v === '')) {
      out.innerHTML = `<div class="box warn">Insufficient data: all indicators are required.</div>`; return;
    }
    if (c.invoices < 6) {
      out.innerHTML = `<div class="box warn">Insufficient data: requires 6 settled invoices.</div>`; return;
    }
    const r = ARIRisk.calculate(Number(rate), Number(delay), Number(growth));
    if (r.insufficient) { out.innerHTML = `<div class="box warn">${this.esc(r.reason)}</div>`; return; }
    this.assessment = { customer: c, result: r };
    const ct = v => (v === 0 ? 'green' : v === 50 ? 'amber' : 'red');
    out.innerHTML = `
      <div class="split">
        ${this.gauge(r.value, r.level, 'risk score')}
        <div>
          <div class="section" style="margin:0 0 8px">Assessment complete</div>
          <div class="result-num">${r.value}<small> / 100</small></div>
          <div style="margin-top:10px">${this.badge(r.level)}</div>
        </div>
      </div>
      <div class="tiles" style="margin-top:16px">
        ${this.tile('Reliability', r.components[0], 'weight 40%', ct(r.components[0]))}
        ${this.tile('Delay', r.components[1], 'weight 40%', ct(r.components[1]))}
        ${this.tile('Growth', r.components[2], 'weight 20%', ct(r.components[2]))}
      </div>`;
  },

  async explainRisk() {
    const el = document.getElementById('riskExplanation');
    if (!this.assessment) {
      el.innerHTML = `<div class="box warn">Complete an assessment first.</div>`;
      return;
    }
    el.innerHTML = `<div class="ai-card"><div class="ai-pulse">Gemini analyzing...</div></div>`;
    const btn = document.getElementById('explainBtn'); if (btn) btn.disabled = true;
    this.toast('✦ Calling Gemini...', 'gemini');
    const { customer, result } = this.assessment;
    const res = await ARIGemini.explainRisk(customer, result);
    if (btn) btn.disabled = false;
    el.innerHTML = res.success
      ? `<div class="ai-card">
           <div class="chips" style="margin-bottom:8px">
             <span class="badge gemini">Gemini</span>
             <span class="chip tone-grey">${this.esc(res.model)}</span>
             <span class="chip tone-grey">${res.duration}ms</span>
           </div>
           <p>${this.esc(res.text).replace(/\n/g, '<br>')}</p>
           <div class="footnote">Requires human review. Score not modified by AI.</div>
         </div>`
      : `<div class="box warn">${this.esc(res.error)}</div>`;
    if (res.success) this.toast(`✦ Gemini finished (${res.duration}ms)`, 'gemini');
  },

  // =====================================================================
  // EXTERNAL INTELLIGENCE
  // =====================================================================
  renderExternal() {
    const custs = ARIDB.query('SELECT * FROM customers');
    const ev = ARIDB.query('SELECT * FROM evidence');
    const verified = ev.filter(e => e.verified === 1).length;
    const geminiEv = ev.filter(e => e.ai_provider === 'gemini').length;
    const byCust = {};
    ev.forEach(e => { (byCust[e.customer_id] = byCust[e.customer_id] || []).push(e); });
    const highExt = custs.filter(c => ARIScraper.scoreExternal(byCust[c.id] || []).level === 'Red').length;
    const n = v => v.toLocaleString('en-US');

    const metrics = [
      ['Monitored Customers', n(custs.length), 'Customer portfolio', '▤', 'blue'],
      ['External Signals', n(ev.length), 'Total evidence', '✦', 'violet'],
      ['Verified Evidence', n(verified), 'Verified records', '◉', 'green'],
      ['Gemini-sourced', n(geminiEv), 'Evidence from Gemini AI', '✦', 'teal'],
      ['High External Risk', n(highExt), 'Red external classification', '◈', 'red'],
      ['Pending Verification', n(ev.length - verified), 'Not eligible yet', '◷', 'amber'],
    ];
    document.getElementById('mExternal').innerHTML = metrics.map(m => this.metric({
      label: m[0], html: `<div class="num"><span class="val">${m[1]}</span></div>`, note: m[2], icon: m[3], tone: m[4],
    })).join('');

    this.renderSourceCards();
    this.renderEvidence();
    this.renderAILog();
  },

  renderSourceCards() {
    const srcs = ARIDB.query('SELECT * FROM sources');
    const grid = document.getElementById('sourceGrid');
    if (!grid) return;
    if (!srcs.length) { grid.innerHTML = '<div class="box warn">No sources registered.</div>'; return; }

    grid.innerHTML = srcs.map(s => {
      const cat = CAT[s.category] || { icon: '◆', tone: 'grey' };
      const approved = s.approved === 1, available = s.available === 1;
      const statusBadge = !approved ? '<span class="badge Red">Unapproved</span>'
        : available ? '<span class="badge Green">Available</span>' : '<span class="badge Red">Outage</span>';
      return `
        <div class="source-card tone-${cat.tone}">
          <div class="src-head">
            <div class="src-icon">${cat.icon}</div>
            <div class="src-meta">
              <div class="name">${this.esc(s.name)}</div>
              <div class="cat">${this.esc(s.category)}</div>
            </div>
          </div>
          <div class="src-status">${statusBadge}${approved ? '' : '<span class="badge Insufficient">Not eligible</span>'}</div>
          <div class="src-foot">
            <span title="Last update">📅 ${this.fmtDate(s.updated)}</span>
            <button class="btn sm ${available ? 'alt' : 'tonal'}" data-toggle-src="${s.id}">${available ? 'Simulate Outage' : 'Restore'}</button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-toggle-src]').forEach(b => {
      b.addEventListener('click', () => {
        const s = ARIDB.query('SELECT * FROM sources WHERE id=?', [b.dataset.toggleSrc])[0];
        if (!s) return;
        ARIDB.exec('UPDATE sources SET available=? WHERE id=?', [s.available ? 0 : 1, s.id]);
        ARIDB.exec('INSERT INTO audit_log(time,item,event) VALUES(?,?,?)',
          [new Date().toISOString(), s.id, s.available ? 'Source outage (demo)' : 'Source restored']);
        this.renderExternal();
      });
    });
  },

  renderEvidence() {
    const all = ARIDB.query('SELECT * FROM evidence LIMIT 2000');
    const names = {};
    ARIDB.query('SELECT id,name FROM customers').forEach(c => { names[c.id] = c.name; });
    this.renderDataTable('evidenceTable',
      ['ID', 'Customer', 'Event', 'Category', 'Severity', 'Ext Score', 'Status', 'Action'],
      all.map(e => {
        const sc = this.evScore(e);
        const cat = CAT[e.category] || { icon: '◆', tone: 'grey' };
        const st = this.evStatus(e);
        const ai = e.ai_provider === 'gemini' ? '<div style="margin-top:4px"><span class="badge gemini">Gemini</span></div>' : '';
        return [
          `<span class="chip mono tone-blue">${this.esc(e.id)}</span>${ai}`,
          `<div class="wrap-cell" style="min-width:130px">${this.esc(names[e.customer_id] || '')}</div>`,
          `<div class="wrap-cell" style="min-width:150px">${this.esc(e.event)}</div>`,
          `<span class="chip tone-${cat.tone}">${cat.icon} ${this.esc(e.category)}</span>`,
          this.badge(this.sevLevel(e.severity)),
          { html: sc === null ? '<span class="muted">N/A</span>' : `<strong>${sc}</strong>`, order: sc ?? -1 },
          `<span class="chip tone-${st.tone}">${st.label}</span>`,
          `<button class="btn sm tonal" data-view-ev="${e.id}">Review</button>`,
        ];
      }),
      { pageLength: 10, order: [[0, 'desc']] }
    );
    const wrapper = document.getElementById('evidenceTable');
    if (wrapper) {
      wrapper.onclick = (e) => {
        const btn = e.target.closest('[data-view-ev]');
        if (btn) { this.showEvidence(btn.dataset.viewEv); this.focusPanel('evidencePanel'); }
      };
    }
    this.showEvidence(this.selectedEvidenceId);
  },

  showEvidence(id) {
    const box = document.getElementById('evidenceDetail');
    const e = ARIDB.query('SELECT * FROM evidence WHERE id=?', [id])[0];
    if (!e) { box.innerHTML = this.empty('✦', 'No evidence selected', 'Press <b>Review</b> on a row of the registry.'); return; }
    this.selectedEvidenceId = id;
    const c = ARIDB.query('SELECT name FROM customers WHERE id=?', [e.customer_id])[0];
    const s = ARIDB.query('SELECT * FROM sources WHERE id=?', [e.source_id])[0];
    const cat = CAT[e.category] || { icon: '◆', tone: 'grey' };
    const st = this.evStatus(e);
    const sc = this.evScore(e);
    const provBadge = e.ai_provider === 'gemini' ? '<span class="badge gemini">Gemini</span>' : '<span class="chip tone-grey">Seed</span>';

    let bars = '';
    try {
      const arr = JSON.parse(e.score || 'null');
      if (Array.isArray(arr) && arr.length === 4) {
        const defs = [['Legal', '35%', 'violet'], ['Financial', '30%', 'blue'], ['Operational', '25%', 'amber'], ['Industry', '10%', 'teal']];
        bars = `<div>
          <div class="section" style="margin:0 0 10px">Score breakdown</div>
          <div class="bars">${defs.map((d, i) => `
            <div class="bar-row tone-${d[2]}">
              <div class="bl">${d[0]}<small>weight ${d[1]}</small></div>
              <div class="trk"><i style="width:${Math.max(0, Math.min(100, arr[i]))}%"></i></div>
              <b>${arr[i]}</b>
            </div>`).join('')}</div>
        </div>`;
      }
    } catch {}

    box.innerHTML = `
      <div class="pcard">
        <div class="p-head">
          <span class="avatar lg tone-${cat.tone}">${cat.icon}</span>
          <div class="p-id">
            <div class="chips" style="margin-bottom:6px"><span class="chip mono tone-blue">${this.esc(e.id)}</span>${provBadge}<span class="chip tone-${st.tone}">${st.label}</span></div>
            <h3>${this.esc(e.event)}</h3>
          </div>
          ${sc === null ? '' : this.gauge(sc, this.scoreLevel(sc), 'score', 'sm')}
        </div>
        <div class="kv">
          <div><div class="k">Customer</div><div class="v">${this.esc(c?.name || '—')}</div></div>
          <div><div class="k">Source</div><div class="v">${this.esc(s?.name || 'TBD')}</div></div>
          <div><div class="k">Category</div><div class="v">${cat.icon} ${this.esc(e.category)}</div></div>
          <div><div class="k">Severity</div><div class="v">${this.badge(this.sevLevel(e.severity))} <span class="muted">${this.esc(e.severity)}</span></div></div>
          <div><div class="k">Confidence</div><div class="v">${this.esc(e.confidence)}</div></div>
          <div><div class="k">Entity match</div><div class="v">${this.esc(e.match_status)}</div></div>
          <div><div class="k">Published</div><div class="v">${this.fmtDate(e.published)}</div></div>
          <div><div class="k">First available</div><div class="v">${this.fmtDate(e.available)}</div></div>
        </div>
        ${bars}
        ${e.summary ? `<div class="quote">${this.esc(e.summary)}</div>` : ''}
        <div class="p-actions">
          <button class="btn ${e.verified ? 'alt' : ''}" id="toggleVerifyBtn">${e.verified ? 'Revoke verification' : 'Verify evidence'}</button>
        </div>
      </div>`;
    document.getElementById('toggleVerifyBtn')?.addEventListener('click', () => {
      ARIDB.exec('UPDATE evidence SET verified=? WHERE id=?', [e.verified ? 0 : 1, e.id]);
      ARIDB.exec('INSERT INTO audit_log(time,item,event) VALUES(?,?,?)',
        [new Date().toISOString(), e.id, e.verified ? 'Verification revoked' : 'Verified']);
      this.toast(e.verified ? 'Verification revoked' : '✓ Evidence verified', e.verified ? '' : 'success');
      this.renderExternal();
    });
  },

  renderAILog() {
    const logs = ARIDB.query('SELECT * FROM ai_log ORDER BY id DESC LIMIT 100');
    this.renderDataTable('aiLogTable',
      ['Time', 'Operation', 'Model', 'Customer', 'Status', 'Duration', 'Details'],
      logs.map(l => [
        this.dt(l.time),
        `<span class="badge gemini">${this.esc(l.operation)}</span>`,
        `<code>${this.esc(l.model)}</code>`,
        this.esc(l.customer),
        this.badge(l.status === 'success' ? 'Green' : 'Red'),
        l.duration_ms + ' ms',
        `<div class="wrap-cell">${this.esc(l.details)}</div>`,
      ]),
      { pageLength: 10 }
    );
  },

  // =====================================================================
  // ALERTS
  // =====================================================================
  renderAlerts() {
    const all = ARIDB.query('SELECT * FROM alerts');
    const names = {};
    ARIDB.query('SELECT id,name FROM customers').forEach(c => { names[c.id] = c.name; });
    this.renderDataTable('alertTable',
      ['Alert', 'Customer', 'Invoice', 'Due', 'Risk', 'Owner', 'Status', 'Action'],
      all.map(a => [
        `<span class="chip mono tone-blue">${this.esc(a.id)}</span>`,
        this.nameCell(names[a.customer_id] || ''),
        this.esc(a.invoice),
        { html: this.fmtDate(a.due), order: a.due },
        this.badge(a.risk),
        `<div class="cell-name">${this.avatar(a.officer, 'sm')}<span>${this.esc(a.officer)}</span></div>`,
        this.badge(a.status),
        `<button class="btn sm tonal" data-view-alert="${a.id}">Review</button>`,
      ]),
      { pageLength: 10, order: [[0, 'desc']] }
    );
    const wrapper = document.getElementById('alertTable');
    if (wrapper) {
      wrapper.onclick = (e) => {
        const btn = e.target.closest('[data-view-alert]');
        if (btn) { this.showAlert(btn.dataset.viewAlert); this.focusPanel('alertPanel'); }
      };
    }
  },

  showAlert(id) {
    const a = ARIDB.query('SELECT * FROM alerts WHERE id=?', [id])[0];
    if (!a) return;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [a.customer_id])[0];
    const lead = this.daysBetween(a.created, a.due);
    const tone = this.tone(a.risk);
    document.getElementById('alertDetail').innerHTML = `
      <div class="pcard">
        <div class="p-head c2">
          ${this.avatar(c?.name || '?', 'lg')}
          <div class="p-id">
            <h3>${this.esc(a.id)} — ${this.esc(c?.name || '')}</h3>
            <div class="chips">
              <span class="chip mono tone-blue">${this.esc(a.invoice)}</span>
              ${this.badge(a.risk)} ${this.badge(a.status)}
              ${a.evidence_id ? `<button class="chip btn-like tone-violet" data-goto-ev="${this.esc(a.evidence_id)}">✦ ${this.esc(a.evidence_id)}</button>` : ''}
            </div>
          </div>
        </div>
        <div class="steps tone-${tone}">
          <div class="step"><span class="d"></span><b>${this.fmtDate(a.created)}</b><small>First alert</small></div>
          <div class="ln"><span>${lead} days lead time</span></div>
          <div class="step"><span class="d"></span><b>${this.fmtDate(a.due)}</b><small>Due date</small></div>
        </div>
        <div class="kv">
          <div><div class="k">Owner</div><div class="v">${this.esc(a.officer)}</div></div>
          <div><div class="k">Customer exposure</div><div class="v">${c ? this.fmtIDRShort(c.exposure) : '—'}</div></div>
          <div><div class="k">Lead time</div><div class="v">${lead} days ${lead >= 5 ? '<span class="chip tone-green">on target</span>' : '<span class="chip tone-amber">below 5 d</span>'}</div></div>
        </div>
        <div class="p-actions"><button class="btn" id="goActionBtn"><span class="ic">▣</span> Record Action</button></div>
      </div>`;
    document.getElementById('goActionBtn')?.addEventListener('click', () => {
      this.navigate('collection');
      $('#actionAlert').val(id).trigger('change');
    });
  },

  // =====================================================================
  // COLLECTION
  // =====================================================================
  renderActions() {
    const list = ARIDB.query('SELECT * FROM actions ORDER BY timestamp DESC LIMIT 500');
    this.renderDataTable('actionHistory',
      ['Action ID', 'Alert', 'Type', 'Notes', 'Time'],
      list.map(a => [
        `<span class="chip mono tone-grey">${this.esc(a.id)}</span>`,
        this.esc(a.alert_id),
        `<span class="chip tone-blue">${this.esc(a.type)}</span>`,
        `<div class="wrap-cell">${this.esc(a.notes)}</div>`,
        this.dt(a.timestamp),
      ]),
      { pageLength: 5, lengthMenu: [[5, 10, 25, -1], [5, 10, 25, 'All']] }
    );
    this.renderCollectionSuggest();
  },

  renderCollectionSuggest() {
    const box = document.getElementById('collectionSuggest');
    const alertId = $('#actionAlert').val();
    if (!alertId) return;
    const a = ARIDB.query('SELECT * FROM alerts WHERE id=?', [alertId])[0];
    if (!a) return;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [a.customer_id])[0];
    if (!c) return;
    const ev = ARIDB.query('SELECT * FROM evidence WHERE customer_id=?', [c.id]);
    const ext = ARIScraper.scoreExternal(ev);

    let action = 'Continue routine monitoring.', owner = 'Collection Officer', priority = 'Low';
    if (ext.level === 'Red') {
      const legal = ext.evidence.some(e => e.category === 'LEGAL');
      action = legal ? 'Initiate legal review & confirm claim position.' : 'Contact Finance PIC to confirm payment schedule.';
      owner = legal ? 'Legal / Credit Manager' : 'Collection Officer';
      priority = 'High';
    } else if (ext.level === 'Yellow') {
      action = 'Review exposure & verify payment plan.'; owner = 'Credit Analyst'; priority = 'Medium';
    } else if (ext.level === 'Insufficient') {
      action = 'Verify source & corporate identity.'; owner = 'Data Analyst'; priority = 'TBD';
    }
    const pTone = priority === 'High' ? 'red' : priority === 'Medium' ? 'amber' : priority === 'Low' ? 'green' : 'grey';
    const chips = ext.evidence.map(e => `<button class="chip btn-like tone-violet mono" data-goto-ev="${this.esc(e.id)}">${this.esc(e.id)}</button>`).join('');

    box.innerHTML = `
      <div class="pcard">
        <div class="p-head">
          ${this.avatar(c.name, 'lg')}
          <div class="p-id">
            <h3>${this.esc(c.name)}</h3>
            <div class="chips">${this.badge(ext.level)}<span class="chip tone-${pTone}">Priority: ${priority}</span></div>
          </div>
          ${this.gauge(ext.value, ext.level, 'external', 'sm')}
        </div>
        <div class="callout">
          <div class="c-ic">✦</div>
          <div><div class="c-t">Suggested action</div><div class="c-b">${this.esc(action)}</div></div>
        </div>
        <div class="kv">
          <div><div class="k">Suggested PIC</div><div class="v"><span class="cell-name" style="display:inline-flex">${this.avatar(owner, 'sm')}${this.esc(owner)}</span></div></div>
          <div><div class="k">External risk</div><div class="v">${this.textLevel(ext.level)}${ext.value !== null ? ' · ' + ext.value + ' / 100' : ''}</div></div>
          <div><div class="k">Supporting evidence</div><div class="v">${chips ? `<div class="chips">${chips}</div>` : '<span class="muted">None verified</span>'}</div></div>
        </div>
        <div class="footnote" style="margin:0">Contractual decisions require human review.</div>
      </div>`;
  },

  saveAction() {
    const alertId = $('#actionAlert').val();
    const type = document.getElementById('actionType').value;
    const notes = document.getElementById('actionNotes').value.trim();
    const msg = document.getElementById('actionMsg');
    if (!alertId || !notes) { msg.innerHTML = '<div class="box warn">Alert & notes required.</div>'; return; }
    const id = 'ACT-' + String(Date.now()).slice(-6);
    ARIDB.exec('INSERT INTO actions(id,alert_id,type,notes,timestamp) VALUES(?,?,?,?,?)',
      [id, alertId, type, notes, new Date().toISOString()]);
    const a = ARIDB.query('SELECT * FROM alerts WHERE id=?', [alertId])[0];
    if (a && a.status === 'Pending') ARIDB.exec("UPDATE alerts SET status='Responded' WHERE id=?", [alertId]);
    document.getElementById('actionNotes').value = '';
    msg.innerHTML = '<div class="box ok">✓ Action saved.</div>';
    this.toast('✓ Collection action saved', 'success');
    this.renderActions();
    this.renderAlerts();
  },

  // =====================================================================
  // MANAGEMENT
  // =====================================================================
  renderManagement() {
    const id = $('#mgrCustomer').val();
    if (!id) return;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;

    // the contract list follows the selected customer
    const mc = document.getElementById('mgrContract');
    if (mc) mc.innerHTML = `<option value="${this.esc(c.contract)}">${this.esc(c.contract)}</option>`;

    const r = ARIRisk.fromCustomer(c);
    const ev = ARIDB.query('SELECT * FROM evidence WHERE customer_id=?', [id]);
    const ext = ARIScraper.scoreExternal(ev);
    document.getElementById('mgrDetail').innerHTML = `
      <div class="pcard">
        <div class="p-head c2">
          ${this.avatar(c.name, 'lg')}
          <div class="p-id"><h3>${this.esc(c.name)}</h3>
            <div class="chips"><span class="chip mono tone-blue">${this.esc(c.contract)}</span><span class="chip tone-green">Active</span></div></div>
        </div>
        <div class="twin">
          <div class="tw tone-${this.tone(r.level)}"><div class="tt">Internal risk</div>${this.gauge(r.value, r.level, '/ 100', 'sm')}${this.badge(r.level)}</div>
          <div class="tw tone-${this.tone(ext.level)}"><div class="tt">External risk</div>${this.gauge(ext.value, ext.level, '/ 100', 'sm')}${this.badge(ext.level)}</div>
        </div>
        <div class="tiles">
          ${this.tile('Exposure', this.fmtIDRShort(c.exposure), this.fmtIDR(c.exposure), 'blue')}
          ${this.tile('On-Time', c.rate + '%', 'Payment reliability', c.rate >= 95 ? 'green' : c.rate >= 80 ? 'amber' : 'red')}
          ${this.tile('Next Due', this.fmtDate(c.due), 'Upcoming invoice', 'violet')}
        </div>
        <div class="box info" style="margin:0">Internal and external scores are shown separately. A combined score is not defined yet.</div>
      </div>`;

    const reviews = ARIDB.query('SELECT * FROM reviews ORDER BY timestamp DESC LIMIT 200');
    const names = {};
    ARIDB.query('SELECT id,name FROM customers').forEach(x => { names[x.id] = x.name; });
    this.renderDataTable('reviewHistory',
      ['Customer', 'Contract', 'Action', 'Note', 'Time'],
      reviews.map(rv => [
        this.nameCell(names[rv.customer_id] || rv.customer_id),
        rv.contract,
        `<span class="chip tone-blue">${this.esc(rv.action)}</span>`,
        `<div class="wrap-cell">${this.esc(rv.notes)}</div>`,
        this.dt(rv.timestamp),
      ]),
      { pageLength: 5, lengthMenu: [[5, 10, 25, -1], [5, 10, 25, 'All']] }
    );
  },

  saveReview() {
    const notes = document.getElementById('mgrNotes').value.trim();
    const action = document.getElementById('mgrAction').value;
    const contract = document.getElementById('mgrContract').value;
    const customerId = $('#mgrCustomer').val();
    const msg = document.getElementById('reviewMsg');
    if (!notes || !action || !contract) { msg.innerHTML = '<div class="box warn">All fields required.</div>'; return; }
    ARIDB.exec('INSERT INTO reviews(customer_id,contract,action,notes,timestamp) VALUES(?,?,?,?,?)',
      [customerId, contract, action, notes, new Date().toISOString()]);
    ARIDB.exec('INSERT INTO audit_log(time,item,event) VALUES(?,?,?)',
      [new Date().toISOString(), customerId, 'Management action: ' + action]);
    document.getElementById('mgrNotes').value = '';
    msg.innerHTML = '<div class="box ok">✓ Review saved. No automatic action executed.</div>';
    this.toast('✓ Management review saved', 'success');
    this.renderManagement();
  },

  // =====================================================================
  // KPI
  // =====================================================================
  renderKPI() {
    const kpi = ARIKPI.computeAll();
    const defs = [
      ['K02 Overdue AR Ratio', kpi.K02, '%', 'Target ≥10% reduction', '◫'],
      ['K06 On-Time Payment', kpi.K06, '%', 'Avg customer rate', '▣'],
      ['K07 Payment Delay Trend', kpi.K07, ' d', 'Avg delay change', '◷'],
      ['K10 Exposure Growth', kpi.K10, '%', 'Portfolio trend', '▤'],
      ['K15 Monitoring Coverage', kpi.K15, '%', 'Target ≥95%', '◉'],
      ['K17 Alert Response SLA', kpi.K17, '%', 'Target ≥90%', '◈'],
      ['K21 Pre-Due Detection', kpi.K21, '%', 'Recall ≥60%', '✦'],
      ['K24 Alert Lead Time', kpi.K24, ' d', 'Target ≥5 days', '◷'],
      ['K22 Alert Precision', kpi.K22, '%', 'Guardrail ≥50%', '✦'],
    ];
    document.getElementById('mKpi').innerHTML = defs.map(d => {
      const v = d[1].value;
      const txt = v === null || v === undefined ? 'N/A' : (typeof v === 'number' ? v.toFixed(1) + d[2] : v + d[2]);
      return this.metric({
        label: d[0], icon: d[4], tone: this.tone(d[1].level),
        html: `<div class="num"><span class="val">${txt}</span></div>`,
        note: `${this.badge(d[1].level)} <span>${d[3]}</span>`,
      });
    }).join('');

    const rows = [
      ['K02', 'Overdue AR Ratio', kpi.K02, '≥10% reduction'],
      ['K06', 'On-Time Payment Rate', kpi.K06, 'TBD'],
      ['K07', 'Payment Delay Trend', kpi.K07, 'TBD'],
      ['K10', 'Exposure Growth Rate', kpi.K10, 'TBD'],
      ['K15', 'Monitoring Coverage', kpi.K15, '≥95%'],
      ['K17', 'Alert Response SLA', kpi.K17, '≥90%'],
      ['K21', 'Pre-Due Detection Recall', kpi.K21, '≥60%'],
      ['K22', 'Alert Precision (Guardrail)', kpi.K22, '≥50%'],
      ['K24', 'Alert Lead Time', kpi.K24, '≥5 days'],
    ];
    this.renderDataTable('kpiTable',
      ['KPI', 'Name', 'Value', 'Status', 'Target'],
      rows.map(r => [
        `<span class="chip mono tone-${this.tone(r[2].level)}">${r[0]}</span>`, r[1],
        r[2].value === null ? 'N/A' : (typeof r[2].value === 'number' ? r[2].value.toFixed(1) : r[2].value),
        this.badge(r[2].level), r[3],
      ]),
      { pageLength: 15, lengthMenu: [[15, 25, -1], [15, 25, 'All']] }
    );
  },

  // =====================================================================
  // SOURCES
  // =====================================================================
  renderSources() {
    const src = ARIDB.query('SELECT * FROM sources');
    this.renderDataTable('sourceListTable',
      ['ID', 'Name', 'Category', 'Approved', 'Available', 'Updated'],
      src.map(s => {
        const cat = CAT[s.category] || { icon: '◆', tone: 'grey' };
        return [
          `<span class="chip mono tone-grey">${this.esc(s.id)}</span>`, this.esc(s.name),
          `<span class="chip tone-${cat.tone}">${cat.icon} ${this.esc(s.category)}</span>`,
          this.badge(s.approved ? 'Green' : 'Red'), this.badge(s.available ? 'Green' : 'Red'),
          { html: this.fmtDate(s.updated), order: s.updated },
        ];
      }),
      { pageLength: 10 }
    );
    const logs = ARIDB.query('SELECT * FROM scrape_log ORDER BY id DESC LIMIT 200');
    this.renderDataTable('scrapeLogTable',
      ['Time', 'Customer', 'Source', 'Status', 'Details'],
      logs.map(l => [
        this.dt(l.time), this.esc(l.customer), this.esc(l.source),
        this.badge(l.status === 'OK' ? 'Green' : 'Red'), `<div class="wrap-cell">${this.esc(l.details)}</div>`,
      ]),
      { pageLength: 10 }
    );
    try {
      const q = sql => ARIDB.query(sql)[0].c;
      const tiles = [
        ['Customers', q('SELECT COUNT(*) c FROM customers'), 'Monitored portfolio', 'blue'],
        ['Alerts', q('SELECT COUNT(*) c FROM alerts'), 'Early warnings', 'red'],
        ['Evidence', q('SELECT COUNT(*) c FROM evidence'), 'External signals', 'violet'],
        ['Gemini-sourced', q("SELECT COUNT(*) c FROM evidence WHERE ai_provider='gemini'"), 'AI evidence', 'teal'],
      ];
      document.getElementById('dbStatus').innerHTML = `
        <div class="chips" style="margin:14px 0"><span class="badge Green">Active</span><span class="chip tone-grey">localStorage persistence</span></div>
        <div class="tiles">${tiles.map(t => this.tile(t[0], Number(t[1]).toLocaleString('en-US'), t[2], t[3])).join('')}</div>`;
    } catch (e) {
      document.getElementById('dbStatus').innerHTML = '<span class="badge Red">Error</span>';
    }
  },

  // =====================================================================
  // CHARTS
  // =====================================================================
  renderCharts() {
    const custs = ARIDB.query('SELECT * FROM customers');
    const alerts = ARIDB.query('SELECT * FROM alerts');
    const C = { p: '#0b57d0', ind: '#6a4df0', sec: '#00639b', err: '#b3261e', ok: '#146c2e', warn: '#b07a00', grey: '#c4c7c5' };
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const hist = { ar: [680, 705, 735, 770, 815, 885], overdue: [85, 95, 110, 118, 132, 150], pay: [93, 92, 89, 87, 84, 82], aging: [360, 185, 115, 65, 35], recall: [42, 45, 49, 53, 57, 60], precision: [35, 38, 42, 45, 48, 50] };

    const baseChart = {
      height: 300, toolbar: { show: false },
      fontFamily: 'Roboto, Google Sans, sans-serif',
      animations: { enabled: true, easing: 'easeinout', speed: 500 },
    };
    const baseLegend = { position: 'bottom', fontSize: '12px', markers: { size: 6 }, itemMargin: { horizontal: 10, vertical: 4 } };
    const baseTooltip = { theme: 'light', style: { fontSize: '12px' } };
    const grid = { borderColor: '#e8ecf4', strokeDashArray: 4 };
    const responsive = [{ breakpoint: 700, options: { chart: { height: 250 }, legend: { position: 'bottom', fontSize: '11px' } } }];

    const draw = (id, options) => {
      if (typeof ApexCharts === 'undefined') return;
      const el = document.getElementById(id);
      if (!el || !el.offsetParent) return;
      if (this.charts[id]) { try { this.charts[id].destroy(); } catch {} delete this.charts[id]; }
      this.charts[id] = new ApexCharts(el, { responsive, ...options });
      this.charts[id].render();
    };

    draw('chartAR', {
      chart: { ...baseChart, type: 'area', zoom: { enabled: false } },
      series: [{ name: 'Total AR', data: hist.ar }, { name: 'Overdue AR', data: hist.overdue }],
      xaxis: { categories: months, axisBorder: { show: false }, axisTicks: { show: false } },
      colors: [C.p, C.err],
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 95, 100] } },
      markers: { size: 4, strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
      legend: baseLegend, tooltip: baseTooltip, grid,
      yaxis: { labels: { formatter: v => Math.round(v) + ' M' } },
      dataLabels: { enabled: false },
    });

    const counts = { Green: 0, Yellow: 0, Red: 0, Insufficient: 0 };
    custs.forEach(c => counts[ARIRisk.fromCustomer(c).level]++);
    draw('chartRisk', {
      chart: { ...baseChart, type: 'donut' },
      series: [counts.Green, counts.Yellow, counts.Red, counts.Insufficient],
      labels: ['Low', 'Medium', 'High', 'Insufficient'],
      colors: [C.ok, C.warn, C.err, C.grey],
      legend: baseLegend, tooltip: baseTooltip,
      plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Customers', fontSize: '12px' } } } } },
      dataLabels: { enabled: false },
      stroke: { width: 3, colors: ['#fff'] },
    });

    draw('chartPay', {
      chart: { ...baseChart, type: 'area', zoom: { enabled: false } },
      series: [{ name: 'On-Time Rate', data: hist.pay }],
      xaxis: { categories: months, axisBorder: { show: false }, axisTicks: { show: false } },
      colors: [C.ok],
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.02 } },
      markers: { size: 4, strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
      legend: { show: false }, tooltip: baseTooltip, grid,
      yaxis: { min: 0, max: 100, labels: { formatter: v => Math.round(v) + '%' } },
      dataLabels: { enabled: false },
    });

    const al = ['Pending', 'Responded', 'Breached'];
    draw('chartAlerts', {
      chart: { ...baseChart, type: 'donut' },
      series: al.map(s => alerts.filter(a => a.status === s).length), labels: al,
      colors: [C.p, C.ok, C.err],
      legend: baseLegend, tooltip: baseTooltip,
      plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Alerts', fontSize: '12px' } } } } },
      dataLabels: { enabled: false },
      stroke: { width: 3, colors: ['#fff'] },
    });

    draw('aAging', {
      chart: { ...baseChart, type: 'bar' },
      series: [{ name: 'Outstanding', data: hist.aging }],
      xaxis: { categories: ['Current', '1–30 D', '31–60 D', '61–90 D', '90+ D'], axisBorder: { show: false }, axisTicks: { show: false } },
      colors: [C.p, '#3d6df4', C.warn, '#c2573a', C.err],
      plotOptions: { bar: { borderRadius: 8, columnWidth: '55%', distributed: true } },
      legend: { show: false }, tooltip: baseTooltip,
      dataLabels: { enabled: false }, grid,
      yaxis: { labels: { formatter: v => Math.round(v) + ' M' } },
    });

    const top10 = [...custs].sort((a, b) => b.exposure - a.exposure).slice(0, 10);
    const short = c => c.name.replace(/^PT /, '').slice(0, 22);
    draw('aExposure', {
      chart: { ...baseChart, type: 'bar' },
      series: [{ name: 'Exposure (M)', data: top10.map(c => Math.round(c.exposure / 1e6)) }],
      plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '62%' } },
      colors: [C.p],
      xaxis: { categories: top10.map(short), labels: { formatter: v => Math.round(v) + ' M' } },
      yaxis: { labels: { maxWidth: 140 } },
      legend: { show: false }, tooltip: baseTooltip,
      dataLabels: { enabled: false }, grid,
    });

    const lvlColor = { Green: C.ok, Yellow: C.warn, Red: C.err, Insufficient: C.grey };
    const topRisk = [...custs].sort((a, b) => (ARIRisk.fromCustomer(b).value ?? -1) - (ARIRisk.fromCustomer(a).value ?? -1)).slice(0, 10);
    draw('aScore', {
      chart: { ...baseChart, type: 'bar' },
      series: [{ name: 'Risk Score', data: topRisk.map(c => ARIRisk.fromCustomer(c).value || 0) }],
      plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '62%', distributed: true } },
      colors: topRisk.map(c => lvlColor[ARIRisk.fromCustomer(c).level]),
      xaxis: { categories: topRisk.map(short), min: 0, max: 100 },
      yaxis: { labels: { maxWidth: 140 } },
      legend: { show: false }, tooltip: baseTooltip,
      dataLabels: { enabled: false }, grid,
    });

    draw('aDetect', {
      chart: { ...baseChart, type: 'line', zoom: { enabled: false } },
      series: [{ name: 'Early Risk Detection', data: hist.recall }, { name: 'Alert Accuracy', data: hist.precision }],
      xaxis: { categories: months, axisBorder: { show: false }, axisTicks: { show: false } },
      colors: [C.ind, C.err],
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4, strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
      legend: baseLegend, tooltip: baseTooltip, grid,
      yaxis: { min: 0, max: 100, labels: { formatter: v => Math.round(v) + '%' } },
      dataLabels: { enabled: false },
    });

    if (document.getElementById('kK21')?.offsetParent) {
      const donut = (id, series, labels, colors) => draw(id, {
        chart: { ...baseChart, type: 'donut', height: 240 },
        series, labels, colors, legend: baseLegend, tooltip: baseTooltip,
        plotOptions: { pie: { donut: { size: '66%' } } },
        dataLabels: { enabled: false }, stroke: { width: 3, colors: ['#fff'] },
      });
      donut('kK21', [6, 4], ['True Positive', 'False Negative'], [C.ok, C.err]);
      donut('kK02', [85, 15], ['Current', 'Overdue'], [C.p, C.err]);
      donut('kK22', [5, 5], ['True Positive', 'False Positive'], [C.ok, C.warn]);
      draw('kK24', {
        chart: { ...baseChart, type: 'bar', height: 240 },
        series: [{ name: 'Days', data: [7] }],
        xaxis: { categories: ['Avg Lead Time'] },
        colors: [C.ok],
        plotOptions: { bar: { borderRadius: 8, horizontal: true, barHeight: '46%' } },
        legend: { show: false }, tooltip: baseTooltip,
        dataLabels: { enabled: true, formatter: v => v + ' days', style: { fontSize: '14px', fontWeight: 600 } },
      });
    }
  },

  renderAll() {
    this.renderDashboard();
    this.renderCustomers();
    this.renderAlerts();
    this.renderActions();
    this.renderManagement();
    this.renderExternal();
    this.renderKPI();
    this.renderSources();
  },

  // =====================================================================
  // UI BUILDING BLOCKS
  // =====================================================================
  metric({ label, html, note, icon = '◫', tone = 'blue' }) {
    return `<div class="metric tone-${tone}">
      <div class="m-top"><div class="label">${label}</div><span class="m-ic">${icon}</span></div>
      ${html}<div class="note">${note}</div></div>`;
  },

  tile(label, value, sub, tone = 'blue') {
    return `<div class="tile tone-${tone}"><div class="tl"><i></i>${this.esc(label)}</div>
      <div class="tv" title="${this.esc(value)}">${this.esc(value)}</div>${sub ? `<div class="ts">${this.esc(sub)}</div>` : ''}</div>`;
  },

  gauge(value, level, caption = '/ 100', size = '') {
    const has = value !== null && value !== undefined && !isNaN(value);
    const pct = has ? Math.max(0, Math.min(100, Number(value))) : 0;
    return `<div class="gauge tone-${has ? this.tone(level) : 'grey'} ${size}" style="--pct:${pct}">
      <div class="gv"><b>${has ? this.esc(value) : 'N/A'}</b><small>${this.esc(caption)}</small></div></div>`;
  },

  scoreBar(value, level) {
    if (value === null || value === undefined) return '<span class="muted">N/A</span>';
    return `<div class="scorebar tone-${this.tone(level)}"><div class="trk"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div><b>${value}</b></div>`;
  },

  empty(icon, title, text) {
    return `<div class="empty"><div class="ei">${icon}</div><div><b>${title}</b></div><div>${text}</div></div>`;
  },

  initials(name) {
    const words = String(name || '?').replace(/^PT\.?\s+/i, '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
    return ((words[0] || '?')[0] + (words[1] ? words[1][0] : '')).toUpperCase();
  },
  avatarTone(name) {
    const tones = ['blue', 'violet', 'teal', 'amber', 'green'];
    let h = 0; String(name || '').split('').forEach(ch => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
    return tones[h % tones.length];
  },
  avatar(name, size = '') {
    return `<span class="avatar ${size} tone-${this.avatarTone(name)}">${this.esc(this.initials(name))}</span>`;
  },
  nameCell(name, sub) {
    return `<div class="cell-name">${this.avatar(name)}<div><div class="n">${this.esc(name)}</div>${sub ? `<div class="s">${this.esc(sub)}</div>` : ''}</div></div>`;
  },

  // ---- evidence helpers
  evScore(e) {
    if (!e.score) return null;
    try {
      const arr = JSON.parse(e.score);
      if (Array.isArray(arr) && arr.length === 4) return Math.round((arr[0] * .35 + arr[1] * .30 + arr[2] * .25 + arr[3] * .10) * 10) / 10;
    } catch {}
    return null;
  },
  evStatus(e) {
    if (!e.verified) return { label: 'Unverified', tone: 'amber' };
    if (e.match_status !== 'Matched') return { label: 'Manual review', tone: 'violet' };
    return { label: 'Verified', tone: 'green' };
  },
  sevLevel(sev) { return sev === 'High' ? 'Red' : sev === 'Medium' ? 'Yellow' : 'Green'; },
  scoreLevel(v) { return v >= 60 ? 'Red' : v >= 30 ? 'Yellow' : 'Green'; },

  // ---- toast / escape / badges
  toast(msg, type = '') {
    const w = document.getElementById('toastWrap');
    if (!w) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    w.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-10px)'; el.style.transition = 'all .3s'; }, 3000);
    setTimeout(() => el.remove(), 3400);
  },
  esc(v) { return String(v ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x])); },
  badge(v) {
    const ok = ['Green', 'Yellow', 'Red', 'Pending', 'Responded', 'Closed', 'Breached', 'Insufficient'];
    return `<span class="badge ${ok.includes(v) ? v : 'Insufficient'}">${this.esc(v)}</span>`;
  },
  tone(level) { return level === 'Red' || level === 'Breached' ? 'red' : level === 'Yellow' ? 'amber' : level === 'Green' || level === 'Responded' ? 'green' : level === 'Pending' ? 'blue' : 'grey'; },
  textLevel(v) { return v === 'Red' ? 'High' : v === 'Yellow' ? 'Medium' : v === 'Green' ? 'Low' : 'Insufficient'; },
  daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); },

  // ---- dates: no raw ISO strings / trailing "Z" in the UI
  fmtDate(s) {
    if (!s || s === 'TBD') return s ? this.esc(s) : '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : this.esc(s);
  },
  fmtDateTime(s) {
    if (!s) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return this.fmtDate(s);
    const d = new Date(s);
    if (isNaN(d)) return this.esc(s);
    const p = n => String(n).padStart(2, '0');
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  },
  /** table cell for a timestamp: friendly text, sorted by the real time */
  dt(s) { return { html: this.fmtDateTime(s), order: Date.parse(s) || 0 }; },

  // ---- currency
  fmtIDR(n) { return 'IDR ' + Number(n).toLocaleString('en-US'); },
  fmtIDRMetric(n) {
    const v = Number(n);
    const full = 'IDR ' + v.toLocaleString('en-US');
    let short;
    if (v >= 1e12) short = (v / 1e12).toFixed(1) + ' T';
    else if (v >= 1e9) short = (v / 1e9).toFixed(1) + ' B';
    else if (v >= 1e6) short = Math.round(v / 1e6) + ' M';
    else short = v.toLocaleString('en-US');
    const len = short.length;
    let cls = '';
    if (len > 12) cls = 'shrink-3'; else if (len > 9) cls = 'shrink-2'; else if (len > 7) cls = 'shrink-1';
    return { html: `<span class="unit">IDR</span><span class="val">${short}</span>`, full, cls };
  },
  fmtIDRShort(n) {
    const v = Number(n);
    if (v >= 1e12) return 'IDR ' + (v / 1e12).toFixed(1) + ' T';
    if (v >= 1e9) return 'IDR ' + (v / 1e9).toFixed(1) + ' B';
    if (v >= 1e6) return 'IDR ' + Math.round(v / 1e6) + ' M';
    if (v >= 1e3) return 'IDR ' + Math.round(v / 1e3) + ' K';
    return 'IDR ' + String(v);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
