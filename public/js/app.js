/**
 * ARI - Main App
 * Chart: ApexCharts · Tables: DataTables · Format: IDR helper
 */

const App = {
  currentPage: 'dashboard',
  assessment: null,
  selectedCustomerId: 'C001',
  selectedEvidenceId: 'EV-001',
  charts: {},
  dataTables: {},

  async init() {
    try {
      await ARIDB.init((pct, txt) => {
        const f = document.getElementById('loadFill');
        const t = document.getElementById('loadText');
        if (f) f.style.width = pct + '%';
        if (t) t.textContent = txt;
      });
      this.hideLoading();
      document.getElementById('app').style.display = 'flex';
      this.bindNav();
      this.bindEvents();
      this.populateDropdowns();
      this.loadRiskInputs();
      this.renderAll();
      
      // 🛠️ FIX: Render charts explicitly on initial load
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

  populateDropdowns() {
    // 🛠️ FIX: Select all to ensure no customers are missing from the dropdown
    const custs = ARIDB.query('SELECT * FROM customers');
    ['riskCustomer', 'mgrCustomer', 'scrapeCustSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = custs.map(c => `<option value="${c.id}">${this.esc(c.name)}</option>`).join('');
    });
    const mc = document.getElementById('mgrContract');
    if (mc) mc.innerHTML = custs.map(c => `<option value="${c.contract}">${c.contract}</option>`).join('');
    
    const alerts = ARIDB.query('SELECT * FROM alerts LIMIT 500');
    const aa = document.getElementById('actionAlert');
    if (aa) aa.innerHTML = alerts.map(a => {
      const c = ARIDB.query('SELECT name FROM customers WHERE id=?', [a.customer_id])[0];
      return `<option value="${a.id}">${a.id} — ${this.esc(c?.name || '')}</option>`;
    }).join('');

    // Initialize Select2 after populating
    $('.select2-dropdown').select2({
      width: '100%',
      placeholder: 'Search and select...',
      allowClear: true
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
    const titles = {
      dashboard:'Executive Dashboard', analytics:'Portfolio Analytics', customers:'Customer Monitoring',
      risk:'Internal Risk Assessment', external:'External Intelligence · Gemini AI',
      alerts:'Alert Management', collection:'Collection Actions', management:'Management Decision Support',
      kpi:'MVP KPI Dashboard', sources:'Data Sources & Configuration',
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    this.renderAll();
    if (['dashboard','analytics','kpi'].includes(page)) requestAnimationFrame(() => this.renderCharts());
  },

  bindEvents() {
    // Use jQuery for Select2 elements to ensure event binding works perfectly
    $('#riskCustomer').on('change', () => this.loadRiskInputs());
    $('#mgrCustomer').on('change', () => this.renderManagement());
    $('#actionAlert').on('change', () => this.renderCollectionSuggest());

    document.getElementById('calcRiskBtn')?.addEventListener('click', () => this.calcRisk());
    document.getElementById('explainBtn')?.addEventListener('click', () => this.explainRisk());
    document.getElementById('saveActionBtn')?.addEventListener('click', () => this.saveAction());
    document.getElementById('saveReviewBtn')?.addEventListener('click', () => this.saveReview());
    document.getElementById('saveWorkerBtn')?.addEventListener('click', () => this.saveWorker());
    document.getElementById('scrapeBtn')?.addEventListener('click', () => this.runScrape());
    document.getElementById('seedBtn')?.addEventListener('click', () => this.runBulkSeed());
    document.getElementById('seedBtn2')?.addEventListener('click', () => this.runBulkSeed());

    const handleReset = () => {
      if (confirm('Reset all data to initial seed?')) ARIDB.reset();
    };
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('resetBtn2')?.addEventListener('click', handleReset);

    document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal')?.addEventListener('click', e => {
      if (e.target.id === 'modal') this.closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });
  },

  async runBulkSeed() {
    if (!confirm('Generate ~1000 customers + alerts + evidence?\n\nExisting data will be overwritten. Process ~3 seconds.')) return;
    const msg = document.getElementById('seedMsg');
    if (msg) msg.innerHTML = '<div class="box info">⚡ Generating 1000 records...</div>';
    this.toast('⚡ Generating 1000 records...', 'gemini');

    setTimeout(() => {
      try {
        const stats = ARIDB.seedBulk((pct, txt) => {
          if (msg) msg.innerHTML = `<div class="box info">⚡ ${txt || 'Processing...'}</div>`;
        });
        this.toast(`✓ Seeded ${stats.customers} customers, ${stats.alerts} alerts, ${stats.evidence} evidence`, 'success');
        if (msg) msg.innerHTML = `<div class="box ok">✓ Success: <strong>${stats.customers}</strong> customers, <strong>${stats.alerts}</strong> alerts, <strong>${stats.evidence}</strong> evidence. Refreshing...</div>`;
        setTimeout(() => location.reload(), 1500);
      } catch (e) {
        this.toast('✗ Seed failed: ' + e.message, 'error');
        if (msg) msg.innerHTML = `<div class="box warn">Error: ${this.esc(e.message)}</div>`;
      }
    }, 100);
  },

  async saveWorker() {
    const url = document.getElementById('workerUrlInput').value.trim();
    if (!url) return;
    ARIGemini.setUrl(url);
    const st = document.getElementById('workerStatus');
    st.innerHTML = '<div class="box info">Testing connection...</div>';
    const res = await ARIGemini.healthCheck();
    if (res.ok) {
      st.innerHTML = '<div class="box ok">✓ Worker connected. Gemini AI active.</div>';
      this.toast('✦ Gemini AI connected', 'gemini');
    } else {
      st.innerHTML = `<div class="box warn">Failed: ${this.esc(res.error || 'Unknown')}</div>`;
    }
  },

  async runScrape() {
    const custId = document.getElementById('scrapeCustSelect').value;
    const cust = ARIDB.query('SELECT * FROM customers WHERE id=?', [custId])[0];
    if (!cust) return;
    const st = document.getElementById('scrapeStatus');
    const act = document.getElementById('aiActivityBox');
    st.innerHTML = '<span class="ai-pulse">Gemini analyzing...</span>';
    if (act) act.innerHTML = `
      <div class="box info">
        <div class="ai-pulse" style="margin-bottom:8px">Gemini AI is working</div>
        <p style="margin:4px 0"><strong>Customer:</strong> ${this.esc(cust.name)}</p>
        <p style="margin:4px 0"><strong>Model:</strong> gemini-3.8-flash</p>
        <p class="muted" style="margin-top:8px">Searching public info: SIPP, IDX, operational news...</p>
      </div>`;
    this.toast('✦ Calling Gemini AI...', 'gemini');

    const res = await ARIScraper.fetchEvidence(cust.name, msg => {
      const p = act?.querySelector('.ai-pulse');
      if (p) p.textContent = msg;
    });

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
         JSON.stringify(ev.score || [50,50,50,50]),
         ev.published_at || new Date().toISOString().slice(0,10),
         ev.first_available_at || new Date().toISOString().slice(0,10),
         ev.summary || 'Gemini-generated evidence', 'gemini']
      );
    });

    st.innerHTML = `<span class="badge gemini">✓ ${res.total} evidence via Gemini</span> <span class="muted">(${res.duration}ms)</span>`;
    if (act) act.innerHTML = `
      <div class="box ok">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="badge gemini">Gemini Success</span>
          <span class="muted">${res.duration}ms · mode: ${res.mode || 'analysis'}</span>
        </div>
        <p style="margin:4px 0"><strong>${res.total} evidence</strong> found for <strong>${this.esc(cust.name)}</strong>.</p>
        <p class="muted" style="margin:4px 0">Model: <code>${res.model || 'gemini-3.8-flash'}</code></p>
      </div>`;
    this.toast(`✦ Gemini found ${res.total} evidence (${res.duration}ms)`, 'gemini');
    this.renderExternal();
  },

  renderDataTable(containerId, headers, rows, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (this.dataTables[containerId]) {
      try { this.dataTables[containerId].destroy(); } catch {}
      delete this.dataTables[containerId];
    }
    container.innerHTML = `
      <table class="display" style="width:100%">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
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

  // ============= DASHBOARD =============
  renderDashboard() {
    const custs = ARIDB.query('SELECT * FROM customers');
    const counts = { Green: 0, Yellow: 0, Red: 0, Insufficient: 0 };
    custs.forEach(c => counts[ARIRisk.fromCustomer(c).level]++);
    const totalExposure = custs.reduce((s, c) => s + c.exposure, 0);

    const exposureFmt = this.fmtIDRMetric(totalExposure);

    const metrics = [
      {
        label: 'Total Exposure',
        html: `<div class="num ${exposureFmt.cls}" title="${exposureFmt.full}">${exposureFmt.html}</div>`,
        note: 'Outstanding customer exposure',
      },
      {
        label: 'Monitored Customers',
        html: `<div class="num"><span class="val">${custs.length.toLocaleString('en-US')}</span></div>`,
        note: 'Active customer portfolio',
      },
      {
        label: 'High-Risk Customers',
        html: `<div class="num"><span class="val">${counts.Red.toLocaleString('en-US')}</span></div>`,
        note: 'Rule-based Red classification',
      },
      {
        label: 'Early Risk Detection',
        html: `<div class="num"><span class="val">60%</span></div>`,
        note: 'Detection recall (K21)',
      },
      {
        label: 'Early Warning Lead Time',
        html: `<div class="num"><span class="val">7 days</span></div>`,
        note: 'First alert before due (K24)',
      },
      {
        label: 'Alert Precision',
        html: `<div class="num"><span class="val">50%</span></div>`,
        note: 'Precision guardrail (K22)',
      },
    ];

    document.getElementById('mDashboard').innerHTML = metrics.map(m =>
      `<div class="metric"><div class="label">${m.label}</div>${m.html}<div class="note">${m.note}</div></div>`
    ).join('');

    const sorted = [...custs].sort((a, b) =>
      (ARIRisk.fromCustomer(b).value ?? -1) - (ARIRisk.fromCustomer(a).value ?? -1)).slice(0, 10);

    this.renderDataTable('watchlist',
      ['Customer', 'Contract', 'Exposure', 'On-Time', 'Risk Score', 'Risk'],
      sorted.map(c => {
        const r = ARIRisk.fromCustomer(c);
        return [
          `<strong>${this.esc(c.name)}</strong>`,
          c.contract,
          this.fmtIDRShort(c.exposure), // 🛠️ FIX: Use short format
          c.rate + '%',
          r.value ?? 'N/A',
          this.badge(r.level),
        ];
      }),
      { pageLength: 10, lengthMenu: [[10, 25, -1], [10, 25, 'All']] }
    );
  },

  renderCustomers() {
    const custs = ARIDB.query('SELECT * FROM customers');
    this.renderDataTable('customerTable',
      ['Customer', 'Contract', 'On-Time', 'Delay', 'Growth', 'Exposure', 'Risk', 'Action'],
      custs.map(c => {
        const r = ARIRisk.fromCustomer(c);
        return [
          this.esc(c.name), c.contract,
          c.rate + '%', c.delay ?? 'N/A', c.growth + '%',
          this.fmtIDRShort(c.exposure), // 🛠️ FIX: Use short format
          this.badge(r.level),
          `<button class="btn sm tonal" data-view-cust="${c.id}">View</button>`,
        ];
      }),
      { pageLength: 25, order: [[0, 'asc']] }
    );
    
    // Event Delegation for Customer Table
    const wrapper = document.getElementById('customerTable');
    if (wrapper) {
      wrapper.onclick = (e) => {
        const btn = e.target.closest('[data-view-cust]');
        if (btn) this.showCustomer(btn.dataset.viewCust);
      };
    }
  },

  showCustomer(id) {
    this.selectedCustomerId = id;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    const r = ARIRisk.fromCustomer(c);
    document.getElementById('customerDetail').innerHTML = `
      <h3>${this.esc(c.name)}</h3>
      <div class="detail">
        <strong>Contract & Risk Profile</strong>
        <p>Contract: ${c.contract}</p>
        <p>Next Due: ${c.due}</p>
        <p>Exposure: ${this.fmtIDR(c.exposure)}</p>
        <p>On-Time: ${c.rate}% · Delay: ${c.delay ?? 'N/A'}d · Growth: ${c.growth}%</p>
        <p>Score: <strong>${r.value ?? 'N/A'} / 100</strong> · ${this.badge(r.level)}</p>
        <button class="btn" id="goAssessBtn">Assess Risk</button>
      </div>`;
    document.getElementById('goAssessBtn')?.addEventListener('click', () => {
      this.navigate('risk');
      $('#riskCustomer').val(id).trigger('change');
    });
    const ev = ARIDB.query('SELECT * FROM evidence WHERE customer_id=?', [id]);
    const ext = ARIScraper.scoreExternal(ev);
    document.getElementById('customerExternal').innerHTML = `
      <h3>${this.esc(c.name)}</h3>
      <p>External Risk: ${ext.value ?? 'N/A'} / 100 · ${this.badge(ext.level)}</p>
      <p>Latest Event: ${this.esc(ext.evidence[0]?.event || 'No verified evidence')}</p>
      <p>Evidence Count: ${ev.length}</p>`;
  },

  loadRiskInputs() {
    const id = $('#riskCustomer').val();
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    document.getElementById('riskRate').value = c.rate;
    document.getElementById('riskDelay').value = c.delay ?? '';
    document.getElementById('riskGrowth').value = c.growth;
    document.getElementById('riskResult').textContent = 'Click Calculate Risk.';
    document.getElementById('riskExplanation').textContent = 'No explanation yet.';
    this.assessment = null;
  },

  calcRisk() {
    const id = $('#riskCustomer').val();
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    const rate = document.getElementById('riskRate').value.trim();
    const delay = document.getElementById('riskDelay').value.trim();
    const growth = document.getElementById('riskGrowth').value.trim();
    this.assessment = null;
    if ([rate, delay, growth].some(v => v === '')) {
      document.getElementById('riskResult').textContent = 'Insufficient Data: all indicators are required.';
      return;
    }
    if (c.invoices < 6) {
      document.getElementById('riskResult').textContent = 'Insufficient Data: requires 6 settled invoices.';
      return;
    }
    const r = ARIRisk.calculate(Number(rate), Number(delay), Number(growth));
    if (r.insufficient) { document.getElementById('riskResult').textContent = r.reason; return; }
    this.assessment = { customer: c, result: r };
    document.getElementById('riskResult').innerHTML = `
      <div class="section">Assessment Complete</div>
      <div style="font-family:'Google Sans',sans-serif;font-size:48px;font-weight:500;color:var(--p);letter-spacing:-.02em">${r.value}<span class="muted" style="font-size:20px"> / 100</span></div>
      <p>Risk: ${this.badge(r.level)}</p>
      <p>Reliability: ${r.components[0]} · Delay: ${r.components[1]} · Growth: ${r.components[2]}</p>`;
    document.getElementById('riskExplanation').textContent = 'Click "Generate AI Explanation".';
  },

  async explainRisk() {
    if (!this.assessment) {
      document.getElementById('riskExplanation').textContent = 'Complete an assessment first.';
      return;
    }
    const el = document.getElementById('riskExplanation');
    el.innerHTML = '<div class="ai-pulse">Gemini analyzing...</div>';
    this.toast('✦ Calling Gemini...', 'gemini');
    const { customer, result } = this.assessment;
    const res = await ARIGemini.explainRisk(customer, result);
    el.innerHTML = res.success
      ? `<div class="box ok">
           <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
             <span class="badge gemini">✦ Gemini</span>
             <span class="muted">${res.model} · ${res.duration}ms</span>
           </div>
           <p>${this.esc(res.text).replace(/\n/g, '<br>')}</p>
           <div class="footnote">Requires human review. Score not modified by AI.</div>
         </div>`
      : `<div class="box warn">${this.esc(res.error)}</div>`;
    if (res.success) this.toast(`✦ Gemini finished (${res.duration}ms)`, 'gemini');
  },

  // ============= EXTERNAL =============
  renderExternal() {
    const custs = ARIDB.query('SELECT * FROM customers');
    const ev = ARIDB.query('SELECT * FROM evidence');
    const verified = ev.filter(e => e.verified === 1).length;
    const geminiEv = ev.filter(e => e.ai_provider === 'gemini').length;
    const highExt = custs.filter(c => {
      const e = ev.filter(x => x.customer_id === c.id);
      return ARIScraper.scoreExternal(e).level === 'Red';
    }).length;

    const metrics = [
      ['Monitored Customers', custs.length.toLocaleString('en-US'), 'Customer portfolio'],
      ['External Signals', ev.length.toLocaleString('en-US'), 'Total evidence'],
      ['Verified Evidence', verified.toLocaleString('en-US'), 'Verified records'],
      ['Gemini-sourced', geminiEv.toLocaleString('en-US'), 'Evidence from Gemini AI'],
      ['High External Risk', highExt.toLocaleString('en-US'), 'Red external classification'],
      ['Pending Verification', (ev.length - verified).toLocaleString('en-US'), 'Not eligible'],
    ];
    document.getElementById('mExternal').innerHTML = metrics.map(m =>
      `<div class="metric"><div class="label">${m[0]}</div><div class="num"><span class="val">${m[1]}</span></div><div class="note">${m[2]}</div></div>`
    ).join('');

    this.renderSourceCards();
    this.renderEvidence();
    this.renderAILog();
  },

  renderSourceCards() {
    const srcs = ARIDB.query('SELECT * FROM sources');
    const icons = {
      LEGAL: '⚖', FINANCIAL: '₨', OPERATIONAL: '⚙', INDUSTRY: '📊', NEWS: '📰',
    };
    const grid = document.getElementById('sourceGrid');
    if (!grid) return;

    if (!srcs.length) {
      grid.innerHTML = '<div class="box warn">No sources registered.</div>';
      return;
    }

    grid.innerHTML = srcs.map(s => {
      const icon = icons[s.category] || '◆';
      const approved = s.approved === 1;
      const available = s.available === 1;
      const statusBadge = !approved
        ? '<span class="badge Red">Unapproved</span>'
        : available
          ? '<span class="badge Green">Available</span>'
          : '<span class="badge Red">Outage</span>';
      const actionLabel = available ? 'Simulate Outage' : 'Restore';
      const actionClass = available ? 'btn sm alt' : 'btn sm tonal';
      return `
        <div class="source-card">
          <div class="src-head">
            <div class="src-icon">${icon}</div>
            <div class="src-meta">
              <div class="name" title="${this.esc(s.name)}">${this.esc(s.name)}</div>
              <div class="cat">${this.esc(s.category)}</div>
            </div>
          </div>
          <div class="src-status">
            ${statusBadge}
            ${approved ? '' : '<span class="badge Insufficient">Not eligible</span>'}
          </div>
          <div class="src-foot">
            <span title="Last update">📅 ${s.updated}</span>
            <button class="${actionClass}" data-toggle-src="${s.id}">${actionLabel}</button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-toggle-src]').forEach(b => {
      b.addEventListener('click', () => {
        const s = ARIDB.query('SELECT * FROM sources WHERE id=?', [b.dataset.toggleSrc])[0];
        if (s) {
          ARIDB.exec('UPDATE sources SET available=? WHERE id=?', [s.available ? 0 : 1, s.id]);
          ARIDB.exec("INSERT INTO audit_log(time,item,event) VALUES(?,?,?)",
            [new Date().toISOString(), s.id, s.available ? 'Source outage (demo)' : 'Source restored']);
          this.renderExternal();
        }
      });
    });
  },

  renderEvidence() {
    const all = ARIDB.query('SELECT * FROM evidence LIMIT 2000');
    this.renderDataTable('evidenceTable',
      ['ID', 'Customer', 'Event', 'Category', 'Severity', 'Ext Score', 'Status', 'Provider', 'Action'],
      all.map(e => {
        const c = ARIDB.query('SELECT name FROM customers WHERE id=?', [e.customer_id])[0];
        let sc = 'N/A';
        if (e.score) {
          try {
            const arr = JSON.parse(e.score);
            if (Array.isArray(arr) && arr.length === 4)
              sc = Math.round((arr[0]*.35 + arr[1]*.30 + arr[2]*.25 + arr[3]*.10)*10)/10;
          } catch {}
        }
        const sevB = e.severity === 'High' ? 'Red' : e.severity === 'Medium' ? 'Yellow' : 'Green';
        const status = !e.verified ? 'Unverified' : e.match_status !== 'Matched' ? 'Manual' : 'Verified';
        const prov = e.ai_provider === 'gemini' ? '<span class="badge gemini">Gemini</span>' : '<span class="muted">Seed</span>';
        return [
          e.id, this.esc(c?.name || ''), this.esc(e.event), e.category,
          this.badge(sevB),
          sc === 'N/A' ? '<span class="muted">N/A</span>' : `<strong>${sc}</strong>`,
          this.esc(status), prov,
          `<button class="btn sm tonal" data-view-ev="${e.id}">Review</button>`,
        ];
      }),
      { pageLength: 25, order: [[0, 'desc']] }
    );
    
    const wrapper = document.getElementById('evidenceTable');
    if (wrapper) {
      wrapper.onclick = (e) => {
        const btn = e.target.closest('[data-view-ev]');
        if (btn) this.showEvidence(btn.dataset.viewEv);
      };
    }
    
    this.showEvidence(this.selectedEvidenceId);
  },

  showEvidence(id) {
    const e = ARIDB.query('SELECT * FROM evidence WHERE id=?', [id])[0];
    if (!e) { document.getElementById('evidenceDetail').textContent = 'Select evidence.'; return; }
    this.selectedEvidenceId = id;
    const c = ARIDB.query('SELECT name FROM customers WHERE id=?', [e.customer_id])[0];
    const s = ARIDB.query('SELECT * FROM sources WHERE id=?', [e.source_id])[0];
    const provBadge = e.ai_provider === 'gemini' ? '<span class="badge gemini">✦ Gemini</span>' : '<span class="badge Insufficient">Seed</span>';
    document.getElementById('evidenceDetail').innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <h3 style="margin:0">${e.id} — ${this.esc(e.event)}</h3>${provBadge}
      </div>
      <p>Customer: ${this.esc(c?.name || '')}</p>
      <p>Source: ${this.esc(s?.name || 'TBD')}</p>
      <p>Category: ${e.category} · Severity: ${e.severity} · Confidence: ${e.confidence}</p>
      <p>Published: ${e.published} · Available: ${e.available}</p>
      <p>Match: ${e.match_status} · Verified: ${e.verified ? 'Yes' : 'No'}</p>
      <p>${this.esc(e.summary || '')}</p>
      <button class="btn alt" id="toggleVerifyBtn">${e.verified ? 'Revoke' : 'Verify'}</button>`;
    document.getElementById('toggleVerifyBtn')?.addEventListener('click', () => {
      ARIDB.exec('UPDATE evidence SET verified=? WHERE id=?', [e.verified ? 0 : 1, e.id]);
      ARIDB.exec("INSERT INTO audit_log(time,item,event) VALUES(?,?,?)",
        [new Date().toISOString(), e.id, e.verified ? 'Verification revoked' : 'Verified']);
      this.renderExternal();
    });
  },

  renderAILog() {
    const logs = ARIDB.query('SELECT * FROM ai_log ORDER BY id DESC LIMIT 100');
    this.renderDataTable('aiLogTable',
      ['Time', 'Operation', 'Model', 'Customer', 'Status', 'Duration', 'Details'],
      logs.map(l => [
        l.time,
        `<span class="badge gemini">${this.esc(l.operation)}</span>`,
        `<code>${this.esc(l.model)}</code>`,
        this.esc(l.customer),
        this.badge(l.status === 'success' ? 'Green' : 'Red'),
        l.duration_ms + 'ms',
        this.esc(l.details),
      ]),
      { pageLength: 10 }
    );
  },

  // ============= ALERTS =============
  renderAlerts() {
    const all = ARIDB.query('SELECT * FROM alerts');
    this.renderDataTable('alertTable',
      ['Alert', 'Customer', 'Invoice', 'Due', 'Risk', 'Owner', 'Status', 'Action'],
      all.map(a => {
        const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [a.customer_id])[0];
        return [
          a.id, this.esc(c?.name || ''), a.invoice, a.due,
          this.badge(a.risk), this.esc(a.officer), this.badge(a.status),
          `<button class="btn sm tonal" data-view-alert="${a.id}">Review</button>`,
        ];
      }),
      { pageLength: 25, order: [[0, 'desc']] }
    );
    
    const wrapper = document.getElementById('alertTable');
    if (wrapper) {
      wrapper.onclick = (e) => {
        const btn = e.target.closest('[data-view-alert]');
        if (btn) this.showAlert(btn.dataset.viewAlert);
      };
    }
  },

  showAlert(id) {
    const a = ARIDB.query('SELECT * FROM alerts WHERE id=?', [id])[0];
    if (!a) return;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [a.customer_id])[0];
    const leadTime = this.daysBetween(a.created, a.due);
    document.getElementById('alertDetail').innerHTML = `
      <div class="detail">
        <h3>${a.id} — ${this.esc(c?.name || '')}</h3>
        <p>Invoice: ${a.invoice}</p>
        <p>Due: ${a.due} · First Alert: ${a.created}</p>
        <p><strong>Lead Time: ${leadTime} days</strong></p>
        <p>Risk: ${this.badge(a.risk)} · Status: ${this.badge(a.status)}</p>
        <p>Owner: ${this.esc(a.officer)}</p>
        <button class="btn" id="goActionBtn">Record Action</button>
      </div>`;
    document.getElementById('goActionBtn')?.addEventListener('click', () => {
      this.navigate('collection');
      $('#actionAlert').val(id).trigger('change');
    });
  },

  // ============= COLLECTION =============
  renderActions() {
    const list = ARIDB.query('SELECT * FROM actions ORDER BY timestamp DESC LIMIT 500');
    this.renderDataTable('actionHistory',
      ['Action ID', 'Alert', 'Type', 'Notes', 'Timestamp'],
      list.map(a => [a.id, a.alert_id, this.esc(a.type), this.esc(a.notes), a.timestamp]),
      { pageLength: 10 }
    );
    this.renderCollectionSuggest();
  },

  renderCollectionSuggest() {
    const alertId = $('#actionAlert').val();
    if (!alertId) return;
    const a = ARIDB.query('SELECT * FROM alerts WHERE id=?', [alertId])[0];
    if (!a) return;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [a.customer_id])[0];
    if (!c) return;
    const ev = ARIDB.query('SELECT * FROM evidence WHERE customer_id=?', [c.id]);
    const ext = ARIScraper.scoreExternal(ev);
    let action = 'Continue routine monitoring.';
    let owner = 'Collection Officer';
    let priority = 'Low';
    if (ext.level === 'Red') {
      const legal = ext.evidence.some(e => e.category === 'LEGAL');
      action = legal ? 'Initiate legal review & confirm claim position.' : 'Contact Finance PIC to confirm payment schedule.';
      owner = legal ? 'Legal / Credit Manager' : 'Collection Officer';
      priority = 'High';
    } else if (ext.level === 'Yellow') {
      action = 'Review exposure & verify payment plan.';
      owner = 'Credit Analyst'; priority = 'Medium';
    } else if (ext.level === 'Insufficient') {
      action = 'Verify source & corporate identity.';
      owner = 'Data Analyst'; priority = 'TBD';
    }
    document.getElementById('collectionSuggest').innerHTML = `
      <h3>${this.esc(c.name)}</h3>
      <p>External Risk: <strong>${this.textLevel(ext.level)}</strong> · Priority: ${priority}</p>
      <p>Supporting Evidence: ${ext.evidence.map(e => e.id).join(', ') || 'None'}</p>
      <p><strong>Suggested Action:</strong> ${this.esc(action)}</p>
      <p>PIC: ${owner} · Contractual decisions require human review.</p>`;
  },

  saveAction() {
    const alertId = $('#actionAlert').val();
    const type = document.getElementById('actionType').value;
    const notes = document.getElementById('actionNotes').value.trim();
    if (!alertId || !notes) {
      document.getElementById('actionMsg').innerHTML = '<div class="box warn">Alert & notes required.</div>';
      return;
    }
    const id = 'ACT-' + String(Date.now()).slice(-6);
    ARIDB.exec('INSERT INTO actions(id,alert_id,type,notes,timestamp) VALUES(?,?,?,?,?)',
      [id, alertId, type, notes, new Date().toISOString()]);
    const a = ARIDB.query('SELECT * FROM alerts WHERE id=?', [alertId])[0];
    if (a && a.status === 'Pending')
      ARIDB.exec("UPDATE alerts SET status='Responded' WHERE id=?", [alertId]);
    document.getElementById('actionNotes').value = '';
    document.getElementById('actionMsg').innerHTML = '<div class="box ok">✓ Action saved.</div>';
    this.toast('✓ Collection action saved', 'success');
    this.renderActions();
    this.renderAlerts();
  },

  // ============= MANAGEMENT =============
  renderManagement() {
    const id = $('#mgrCustomer').val();
    if (!id) return;
    const c = ARIDB.query('SELECT * FROM customers WHERE id=?', [id])[0];
    if (!c) return;
    const r = ARIRisk.fromCustomer(c);
    const ev = ARIDB.query('SELECT * FROM evidence WHERE customer_id=?', [id]);
    const ext = ARIScraper.scoreExternal(ev);
    document.getElementById('mgrDetail').innerHTML = `
      <p><strong>${this.esc(c.name)}</strong></p>
      <p>Exposure: ${this.fmtIDR(c.exposure)} · On-Time: ${c.rate}%</p>
      <p>Internal Risk: <strong>${r.value ?? 'N/A'}</strong> · ${this.badge(r.level)}</p>
      <p>External Risk: <strong>${ext.value ?? 'N/A'}</strong> · ${this.badge(ext.level)}</p>`;
    const reviews = ARIDB.query('SELECT * FROM reviews ORDER BY timestamp DESC LIMIT 200');
    this.renderDataTable('reviewHistory',
      ['Customer', 'Contract', 'Action', 'Note', 'Timestamp'],
      reviews.map(rv => {
        const cu = ARIDB.query('SELECT name FROM customers WHERE id=?', [rv.customer_id])[0];
        return [this.esc(cu?.name || rv.customer_id), rv.contract, this.esc(rv.action), this.esc(rv.notes), rv.timestamp];
      }),
      { pageLength: 10 }
    );
  },

  saveReview() {
    const notes = document.getElementById('mgrNotes').value.trim();
    const action = document.getElementById('mgrAction').value;
    const contract = document.getElementById('mgrContract').value;
    const customerId = $('#mgrCustomer').val();
    if (!notes || !action || !contract) {
      document.getElementById('reviewMsg').innerHTML = '<div class="box warn">All fields required.</div>';
      return;
    }
    ARIDB.exec('INSERT INTO reviews(customer_id,contract,action,notes,timestamp) VALUES(?,?,?,?,?)',
      [customerId, contract, action, notes, new Date().toISOString()]);
    ARIDB.exec("INSERT INTO audit_log(time,item,event) VALUES(?,?,?)",
      [new Date().toISOString(), customerId, 'Management action: ' + action]);
    document.getElementById('mgrNotes').value = '';
    document.getElementById('reviewMsg').innerHTML = '<div class="box ok">✓ Review saved. No automatic action executed.</div>';
    this.toast('✓ Management review saved', 'success');
    this.renderManagement();
  },

  // ============= KPI =============
  renderKPI() {
    const kpi = ARIKPI.computeAll();
    const metrics = [
      ['K02 Overdue AR Ratio', kpi.K02.value, '%', 'Target ≥10% reduction'],
      ['K06 On-Time Payment', kpi.K06.value, '%', 'Avg customer rate'],
      ['K07 Payment Delay Trend', kpi.K07.value, ' d', 'Avg delay change'],
      ['K10 Exposure Growth', kpi.K10.value, '%', 'Portfolio trend'],
      ['K15 Monitoring Coverage', kpi.K15.value, '%', 'Target ≥95%'],
      ['K17 Alert Response SLA', kpi.K17.value, '%', 'Target ≥90%'],
      ['K21 Pre-Due Detection', kpi.K21.value, '%', 'Recall ≥60%'],
      ['K24 Alert Lead Time', kpi.K24.value, ' d', 'Target ≥5 days'],
      ['K22 Alert Precision', kpi.K22.value, '%', 'Guardrail ≥50%'],
    ];
    document.getElementById('mKpi').innerHTML = metrics.map(m => {
      const v = m[1] === null || m[1] === undefined ? 'N/A' : (typeof m[1] === 'number' ? m[1].toFixed(1) + m[2] : m[1] + m[2]);
      return `<div class="metric"><div class="label">${m[0]}</div><div class="num"><span class="val">${v}</span></div><div class="note">${m[3]}</div></div>`;
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
        `<strong>${r[0]}</strong>`, r[1],
        r[2].value === null ? 'N/A' : (typeof r[2].value === 'number' ? r[2].value.toFixed(1) : r[2].value),
        this.badge(r[2].level), r[3],
      ]),
      { pageLength: 15, lengthMenu: [[15, 25, -1], [15, 25, 'All']] }
    );
  },

  // ============= SOURCES =============
  renderSources() {
    const src = ARIDB.query('SELECT * FROM sources');
    this.renderDataTable('sourceListTable',
      ['ID', 'Name', 'Category', 'Approved', 'Available', 'Updated'],
      src.map(s => [s.id, this.esc(s.name), s.category,
        this.badge(s.approved ? 'Green' : 'Red'),
        this.badge(s.available ? 'Green' : 'Red'), s.updated]),
      { pageLength: 10 }
    );
    const logs = ARIDB.query('SELECT * FROM scrape_log ORDER BY id DESC LIMIT 200');
    this.renderDataTable('scrapeLogTable',
      ['Time', 'Customer', 'Source', 'Status', 'Details'],
      logs.map(l => [l.time, this.esc(l.customer), this.esc(l.source),
        this.badge(l.status === 'OK' ? 'Green' : 'Red'), this.esc(l.details)]),
      { pageLength: 10 }
    );
    try {
      const count = ARIDB.query('SELECT COUNT(*) c FROM customers')[0].c;
      const acount = ARIDB.query('SELECT COUNT(*) c FROM alerts')[0].c;
      const ecount = ARIDB.query('SELECT COUNT(*) c FROM evidence')[0].c;
      const gcount = ARIDB.query("SELECT COUNT(*) c FROM evidence WHERE ai_provider='gemini'")[0].c;
      const workerUrl = ARIGemini.getUrl();
      document.getElementById('dbStatus').innerHTML = `
        <span class="badge Green">Active</span> · localStorage persistence<br>
        <p style="margin:8px 0"><strong>${count.toLocaleString('en-US')}</strong> customers · <strong>${acount.toLocaleString('en-US')}</strong> alerts · <strong>${ecount.toLocaleString('en-US')}</strong> evidence · <strong>${gcount.toLocaleString('en-US')}</strong> Gemini-sourced</p>
        <p style="margin:8px 0" class="muted">Worker: <code>${this.esc(workerUrl || 'Not configured')}</code></p>`;
      const wi = document.getElementById('workerUrlInput');
      if (wi && !wi.value) wi.value = workerUrl || '';
    } catch (e) {
      document.getElementById('dbStatus').innerHTML = '<span class="badge Red">Error</span>';
    }
  },

  // ============= CHARTS =============
  renderCharts() {
    const custs = ARIDB.query('SELECT * FROM customers');
    const alerts = ARIDB.query('SELECT * FROM alerts');
    const C = { p:'#0b57d0', sec:'#00639b', err:'#b3261e', ok:'#146c2e', warn:'#7c5800', grey:'#c4c7c5' };
    const months = ['May','Jun','Jul','Aug','Sep','Oct'];
    const hist = { ar:[680,705,735,770,815,885], overdue:[85,95,110,118,132,150], pay:[93,92,89,87,84,82], aging:[360,185,115,65,35], recall:[42,45,49,53,57,60], precision:[35,38,42,45,48,50] };

    const baseChart = {
      height: 300, toolbar: { show: false },
      fontFamily: 'Roboto, Google Sans, sans-serif',
      animations: { enabled: true, easing: 'easeinout', speed: 500 },
    };
    const baseLegend = { position: 'bottom', fontSize: '12px', markers: { size: 6 } };
    const baseTooltip = { theme: 'light', style: { fontSize: '12px' } };

    const draw = (id, options) => {
      if (typeof ApexCharts === 'undefined') return;
      const el = document.getElementById(id);
      if (!el || !el.offsetParent) return;
      if (this.charts[id]) { try { this.charts[id].destroy(); } catch {} delete this.charts[id]; }
      this.charts[id] = new ApexCharts(el, options);
      this.charts[id].render();
    };

    draw('chartAR', {
      chart: { ...baseChart, type: 'line', zoom: { enabled: false } },
      series: [
        { name: 'Total AR', data: hist.ar },
        { name: 'Overdue AR', data: hist.overdue },
      ],
      xaxis: { categories: months },
      colors: [C.p, C.err],
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4, hover: { size: 6 } },
      legend: baseLegend, tooltip: baseTooltip,
      grid: { borderColor: '#e1e3e1', strokeDashArray: 3 },
      yaxis: { labels: { formatter: v => Math.round(v) + ' M' } },
      dataLabels: { enabled: false },
    });

    const counts = { Green: 0, Yellow: 0, Red: 0, Insufficient: 0 };
    custs.forEach(c => counts[ARIRisk.fromCustomer(c).level]++);
    draw('chartRisk', {
      chart: { ...baseChart, type: 'donut' },
      series: [counts.Green, counts.Yellow, counts.Red, counts.Insufficient],
      labels: ['Low','Medium','High','Insufficient'],
      colors: [C.ok, C.warn, C.err, C.grey],
      legend: baseLegend, tooltip: baseTooltip,
      plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '12px' } } } } },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#fff'] },
    });

    draw('chartPay', {
      chart: { ...baseChart, type: 'area', zoom: { enabled: false } },
      series: [{ name: 'On-Time Rate', data: hist.pay }],
      xaxis: { categories: months },
      colors: [C.p],
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
      markers: { size: 4, hover: { size: 6 } },
      legend: { show: false }, tooltip: baseTooltip,
      grid: { borderColor: '#e1e3e1', strokeDashArray: 3 },
      yaxis: { min: 0, max: 100, labels: { formatter: v => Math.round(v) + '%' } },
      dataLabels: { enabled: false },
    });

    const al = ['Pending','Responded','Breached'];
    const av = al.map(s => alerts.filter(a => a.status === s).length);
    draw('chartAlerts', {
      chart: { ...baseChart, type: 'donut' },
      series: av, labels: al,
      colors: [C.p, C.ok, C.err],
      legend: baseLegend, tooltip: baseTooltip,
      plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Alerts', fontSize: '12px' } } } } },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#fff'] },
    });

    draw('aAging', {
      chart: { ...baseChart, type: 'bar' },
      series: [{ name: 'Outstanding', data: hist.aging }],
      xaxis: { categories: ['Current','1–30 D','31–60 D','61–90 D','90+ D'] },
      colors: [C.p],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: true } },
      legend: { show: false }, tooltip: baseTooltip,
      dataLabels: { enabled: false },
      grid: { borderColor: '#e1e3e1', strokeDashArray: 3 },
      yaxis: { labels: { formatter: v => Math.round(v) + ' M' } },
    });

    const top10 = [...custs].sort((a,b) => b.exposure - a.exposure).slice(0, 10);
    draw('aExposure', {
      chart: { ...baseChart, type: 'bar' },
      series: [{ name: 'Exposure (M)', data: top10.map(c => Math.round(c.exposure/1e6)) }],
      plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '60%' } },
      colors: [C.p],
      xaxis: { categories: top10.map(c => c.name.replace(/^PT /,'').slice(0, 22)), labels: { formatter: v => Math.round(v) + ' M' } },
      legend: { show: false }, tooltip: baseTooltip,
      dataLabels: { enabled: false },
      grid: { borderColor: '#e1e3e1', strokeDashArray: 3 },
    });

    draw('aScore', {
      chart: { ...baseChart, type: 'bar' },
      series: [{ name: 'Risk Score', data: top10.map(c => ARIRisk.fromCustomer(c).value || 0) }],
      plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '60%', distributed: true } },
      colors: top10.map(c => ({ Green: C.ok, Yellow: C.warn, Red: C.err, Insufficient: C.grey }[ARIRisk.fromCustomer(c).level])),
      xaxis: { categories: top10.map(c => c.name.replace(/^PT /,'').slice(0, 22)), min: 0, max: 100 },
      legend: { show: false }, tooltip: baseTooltip,
      dataLabels: { enabled: false },
      grid: { borderColor: '#e1e3e1', strokeDashArray: 3 },
    });

    draw('aDetect', {
      chart: { ...baseChart, type: 'line', zoom: { enabled: false } },
      series: [
        { name: 'Early Risk Detection', data: hist.recall },
        { name: 'Alert Accuracy', data: hist.precision },
      ],
      xaxis: { categories: months },
      colors: [C.p, C.err],
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4, hover: { size: 6 } },
      legend: baseLegend, tooltip: baseTooltip,
      grid: { borderColor: '#e1e3e1', strokeDashArray: 3 },
      yaxis: { min: 0, max: 100, labels: { formatter: v => Math.round(v) + '%' } },
      dataLabels: { enabled: false },
    });

    if (document.getElementById('kK21')?.offsetParent) {
      draw('kK21', {
        chart: { ...baseChart, type: 'donut', height: 240 },
        series: [6, 4], labels: ['True Positive','False Negative'],
        colors: [C.ok, C.err], legend: baseLegend, tooltip: baseTooltip,
        plotOptions: { pie: { donut: { size: '65%' } } },
        dataLabels: { enabled: false }, stroke: { width: 2, colors: ['#fff'] },
      });
      draw('kK24', {
        chart: { ...baseChart, type: 'bar', height: 240 },
        series: [{ name: 'Days', data: [7] }],
        xaxis: { categories: ['Avg Lead Time'] },
        colors: [C.ok],
        plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '50%' } },
        legend: { show: false }, tooltip: baseTooltip,
        dataLabels: { enabled: true, formatter: v => v + ' days', style: { fontSize: '14px', fontWeight: 600 } },
      });
      draw('kK02', {
        chart: { ...baseChart, type: 'donut', height: 240 },
        series: [85, 15], labels: ['Current','Overdue'],
        colors: [C.p, C.err], legend: baseLegend, tooltip: baseTooltip,
        plotOptions: { pie: { donut: { size: '65%' } } },
        dataLabels: { enabled: false }, stroke: { width: 2, colors: ['#fff'] },
      });
      draw('kK22', {
        chart: { ...baseChart, type: 'donut', height: 240 },
        series: [5, 5], labels: ['True Positive','False Positive'],
        colors: [C.ok, C.warn], legend: baseLegend, tooltip: baseTooltip,
        plotOptions: { pie: { donut: { size: '65%' } } },
        dataLabels: { enabled: false }, stroke: { width: 2, colors: ['#fff'] },
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

  // ============= UTILS =============
  toast(msg, type='') {
    const w = document.getElementById('toastWrap');
    if (!w) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    w.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-10px)'; el.style.transition = 'all .3s'; }, 3000);
    setTimeout(() => el.remove(), 3400);
  },
  esc(v) { return String(v ?? '').replace(/[&<>"']/g, x => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[x])); },
  badge(v) {
    const ok = ['Green','Yellow','Red','Pending','Responded','Closed','Breached','Insufficient'];
    return `<span class="badge ${ok.includes(v) ? v : 'Insufficient'}">${this.esc(v)}</span>`;
  },
  textLevel(v) { return v === 'Red' ? 'High' : v === 'Yellow' ? 'Medium' : v === 'Green' ? 'Low' : 'Insufficient'; },
  daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); },

  fmtIDR(n) {
    return 'IDR ' + Number(n).toLocaleString('en-US');
  },

  fmtIDRMetric(n) {
    const v = Number(n);
    const full = 'IDR ' + v.toLocaleString('en-US');
    let short;
    if (v >= 1e12)      short = (v/1e12).toFixed(1) + ' T';
    else if (v >= 1e9)  short = (v/1e9).toFixed(1)  + ' B';
    else if (v >= 1e6)  short = Math.round(v/1e6) + ' M';
    else                short = v.toLocaleString('en-US');

    const len = short.length;
    let cls = '';
    if (len > 12) cls = 'shrink-3';
    else if (len > 9) cls = 'shrink-2';
    else if (len > 7) cls = 'shrink-1';

    return {
      html: `<span class="unit">IDR</span><span class="val">${short}</span>`,
      full,
      cls,
    };
  },

  fmtIDRShort(n) {
    const v = Number(n);
    if (v >= 1e12) return 'IDR ' + (v/1e12).toFixed(1) + ' T';
    if (v >= 1e9)  return 'IDR ' + (v/1e9).toFixed(1) + ' B';
    if (v >= 1e6)  return 'IDR ' + Math.round(v/1e6) + ' M';
    if (v >= 1e3)  return 'IDR ' + Math.round(v/1e3) + ' K';
    return 'IDR ' + String(v);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
window.ARIApp = App;