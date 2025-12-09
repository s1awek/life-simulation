/**
 * UI - Control panel and statistics with Evolution Log
 */
export class UI {
  constructor(world, renderer) {
    this.world = world;
    this.renderer = renderer;
    this.container = null;
    this.logFilter = 'all'; // 'all', 'elite', 'birth', 'death', 'kill'
    this.survivorLogVisible = false;

    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'ui-panel';
    this.container.innerHTML = this.getHTML();
    document.body.appendChild(this.container);

    this.bindEvents();
  }

  getHTML() {
    return `
      <div class="ui-header">
        <h1>🧬 Evolution</h1>
        <p class="ui-subtitle">Neural Network Predator-Prey Simulation</p>
      </div>
      
      <div class="ui-section">
        <h2>Controls</h2>
        <div class="ui-controls">
          <button id="btn-pause" class="ui-btn ui-btn-primary">
            <span class="icon">⏸</span> Pause
          </button>
          <div class="speed-control">
            <label>Speed</label>
            <input type="range" id="speed-slider" min="1" max="10" value="1">
            <span id="speed-value">1x</span>
          </div>
        </div>
      </div>
      
      <div class="ui-section">
        <h2>Population</h2>
        <div class="stats-grid population-grid">
          <div class="stat-item predator">
            <span class="stat-label">🔴 Predators</span>
            <span class="stat-value" id="stat-predators">0</span>
          </div>
          <div class="stat-item herbivore">
            <span class="stat-label">🟢 Herbivores</span>
            <span class="stat-value" id="stat-herbivores">0</span>
          </div>
        </div>
      </div>
      
      <div class="ui-section">
        <h2>Statistics</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Generation</span>
            <span class="stat-value" id="stat-gen">1</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Tick</span>
            <span class="stat-value" id="stat-tick">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Alive</span>
            <span class="stat-value" id="stat-alive">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Kills</span>
            <span class="stat-value" id="stat-kills">0</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Avg Fitness</span>
            <span class="stat-value" id="stat-avg-fitness">0</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Max Fitness</span>
            <span class="stat-value" id="stat-max-fitness">0</span>
          </div>
        </div>
      </div>
      
      <div class="ui-section">
        <h2>Fitness History</h2>
        <canvas id="chart-canvas" width="280" height="120"></canvas>
      </div>
      
      <div class="ui-section">
        <h2>Evolution Log</h2>
        <div class="log-filters">
          <button class="log-filter active" data-filter="all">All</button>
          <button class="log-filter" data-filter="elite">👑</button>
          <button class="log-filter" data-filter="birth">🐣</button>
          <button class="log-filter" data-filter="death">💀</button>
          <button class="log-filter" data-filter="kill">⚔️</button>
        </div>
        <div class="evolution-log" id="evolution-log">
          <div class="log-entry placeholder">Waiting for events...</div>
        </div>
      </div>
      
      <div class="ui-section">
        <div class="section-header-toggle">
          <h2>Generation Survivors</h2>
          <button id="btn-toggle-survivors" class="toggle-btn">▶</button>
        </div>
        <div id="survivor-log" class="survivor-log collapsed">
          <div class="survivor-placeholder">Complete a generation to see survivors...</div>
        </div>
      </div>
      
      <div class="ui-section">
        <h2>🏆 Records</h2>
        <div class="records-grid">
          <div class="record-item">
            <span class="record-label">Best Fitness</span>
            <span class="record-value" id="record-max-fitness">0</span>
            <span class="record-gen" id="record-max-fitness-gen">Gen 0</span>
          </div>
          <div class="record-item">
            <span class="record-label">Best Avg</span>
            <span class="record-value" id="record-best-avg">0</span>
            <span class="record-gen" id="record-best-avg-gen">Gen 0</span>
          </div>
          <div class="record-item">
            <span class="record-label">Most Kills</span>
            <span class="record-value" id="record-most-kills">0</span>
            <span class="record-gen" id="record-most-kills-gen">Gen 0</span>
          </div>
        </div>
      </div>
      
      <div class="ui-section">
        <h2>Display</h2>
        <div class="ui-toggles">
          <label class="toggle">
            <input type="checkbox" id="toggle-grid" checked>
            <span>Show Grid</span>
          </label>
          <label class="toggle">
            <input type="checkbox" id="toggle-sensors">
            <span>Show Sensors</span>
          </label>
          <label class="toggle">
            <input type="checkbox" id="toggle-all-stats">
            <span>Show All Stats (on pause)</span>
          </label>
        </div>
      </div>
      
      <div class="ui-footer">
        <p>🔴 Predators hunt 🟢 Herbivores</p>
        <p>Best genes survive and evolve</p>
      </div>
    `;
  }

  bindEvents() {
    // Pause button
    document.getElementById('btn-pause').addEventListener('click', () => {
      const isPaused = this.world.togglePause();
      const btn = document.getElementById('btn-pause');
      btn.innerHTML = isPaused
        ? '<span class="icon">▶</span> Play'
        : '<span class="icon">⏸</span> Pause';
      btn.classList.toggle('paused', isPaused);
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      const speed = parseInt(e.target.value);
      this.world.setSpeed(speed);
      document.getElementById('speed-value').textContent = `${speed}x`;
    });

    // Toggles
    document.getElementById('toggle-grid').addEventListener('change', () => {
      this.renderer.toggleGrid();
    });

    document.getElementById('toggle-sensors').addEventListener('change', () => {
      this.renderer.toggleSensors();
    });

    document.getElementById('toggle-all-stats').addEventListener('change', () => {
      this.renderer.toggleAllTooltips();
    });

    // Log filters
    document.querySelectorAll('.log-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.log-filter').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.logFilter = e.target.dataset.filter;
        this.updateLog();
      });
    });

    // Survivor log toggle
    document.getElementById('btn-toggle-survivors').addEventListener('click', () => {
      this.survivorLogVisible = !this.survivorLogVisible;
      const btn = document.getElementById('btn-toggle-survivors');
      const logEl = document.getElementById('survivor-log');
      btn.textContent = this.survivorLogVisible ? '▼' : '▶';
      logEl.classList.toggle('collapsed', !this.survivorLogVisible);
      if (this.survivorLogVisible) {
        this.updateSurvivorLog();
      }
    });
  }

  /**
   * Update UI with current stats
   */
  update() {
    const s = this.world.stats;

    document.getElementById('stat-gen').textContent = s.generation;
    document.getElementById('stat-tick').textContent = s.tick;
    document.getElementById('stat-alive').textContent = s.alive;
    document.getElementById('stat-predators').textContent = s.predators;
    document.getElementById('stat-herbivores').textContent = s.herbivores;
    document.getElementById('stat-kills').textContent = s.kills;
    document.getElementById('stat-avg-fitness').textContent = s.avgFitness.toFixed(1);
    document.getElementById('stat-max-fitness').textContent = s.maxFitness.toFixed(1);

    // Update chart
    this.drawChart();

    // Update evolution log
    this.updateLog();

    // Update survivor log if visible
    if (this.survivorLogVisible) {
      this.updateSurvivorLog();
    }

    // Update records
    this.updateRecords();
  }

  updateLog() {
    const logContainer = document.getElementById('evolution-log');
    const entries = this.world.evolutionLog.getFormattedEntries(20);

    // Filter entries
    const filtered = this.logFilter === 'all'
      ? entries
      : entries.filter(e => e.type === this.logFilter);

    if (filtered.length === 0) {
      if (!this._lastLogEmpty) {
        logContainer.innerHTML = '<div class="log-entry placeholder">No events yet...</div>';
        this._lastLogEmpty = true;
      }
      return;
    }

    // Create a hash of current entries to check if update needed
    const currentHash = filtered.map(e => `${e.type}-${e.timestamp}`).join('|');
    if (currentHash === this._lastLogHash) {
      return; // No changes, skip DOM update
    }
    this._lastLogHash = currentHash;
    this._lastLogEmpty = false;

    logContainer.innerHTML = filtered.map(entry => `
      <div class="log-entry ${entry.type} ${entry.isPredator ? 'predator' : 'herbivore'}">
        <span class="log-icon">${entry.icon}</span>
        <span class="log-text">${entry.text}</span>
      </div>
    `).join('');
  }

  drawChart() {
    const canvas = document.getElementById('chart-canvas');
    const ctx = canvas.getContext('2d');
    const history = this.world.stats.history;

    // Get the actual displayed size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Resize canvas to match display size with high-DPI support
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = displayWidth;
    const height = displayHeight;

    if (history.length < 2) {
      // Show placeholder when no data
      ctx.fillStyle = 'rgba(15, 15, 26, 0.8)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for data...', width / 2, height / 2);
      ctx.textAlign = 'left';
      return;
    }

    // Clear
    ctx.fillStyle = 'rgba(15, 15, 26, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Find max for scaling
    const maxVal = Math.max(...history.map(h => h.maxFitness), 1);
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - 10; // Extra space for legend

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw average fitness line (with area fill)
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    for (let i = 0; i < history.length; i++) {
      const x = padding + (i / (history.length - 1)) * chartWidth;
      const y = padding + 10 + (1 - history[i].avgFitness / maxVal) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw max fitness line
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;

    for (let i = 0; i < history.length; i++) {
      const x = padding + (i / (history.length - 1)) * chartWidth;
      const y = padding + 10 + (1 - history[i].maxFitness / maxVal) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Legend
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('● Avg', padding, 12);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● Max', padding + 45, 12);

    // Show current max value
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxVal.toFixed(0)}`, width - padding, 12);
    ctx.textAlign = 'left';
  }

  /**
   * Update survivor log with details from last generation
   */
  updateSurvivorLog() {
    const logEl = document.getElementById('survivor-log');
    const summary = this.world.evolutionLog.getSurvivorSummary();

    if (!summary) {
      logEl.innerHTML = '<div class="survivor-placeholder">Complete a generation to see survivors...</div>';
      return;
    }

    let html = `
      <div class="survivor-header">
        <span class="survivor-gen">Generation ${summary.generation}</span>
        <span class="survivor-stats">👑 ${summary.eliteCount} elites • 🧬 ${summary.offspringCount} offspring</span>
      </div>
      <div class="survivor-summary">
        <span>Avg: ${summary.avgFitness.toFixed(1)}</span>
        <span>Max: ${summary.maxFitness.toFixed(1)}</span>
      </div>
    `;

    // Show elite details
    if (summary.elites.length > 0) {
      html += '<div class="survivor-elites"><div class="survivor-section-title">👑 Elite Survivors</div>';
      for (const elite of summary.elites) {
        const typeIcon = elite.isPredator ? '🔴' : '🟢';
        html += `
          <div class="survivor-elite-entry ${elite.isPredator ? 'predator' : 'herbivore'}">
            <span class="elite-rank">#${elite.rank}</span>
            <span class="elite-type">${typeIcon}</span>
            <span class="elite-fitness">Fitness: ${elite.fitness.toFixed(1)}</span>
          </div>
        `;
      }
      html += '</div>';
    }

    // Show trait averages if available
    if (summary.traitAverages && Object.keys(summary.traitAverages).length > 0) {
      html += '<div class="survivor-traits"><div class="survivor-section-title">📊 Elite Trait Averages</div><div class="trait-grid">';
      const traitLabels = {
        size: '📏 Size',
        speed: '⚡ Speed',
        vision: '👁️ Vision',
        metabolism: '🔥 Metabolism',
        aggression: '⚔️ Aggression'
      };
      for (const [key, value] of Object.entries(summary.traitAverages)) {
        const label = traitLabels[key] || key;
        html += `
          <div class="trait-item">
            <span class="trait-label">${label}</span>
            <span class="trait-value">${value.toFixed(2)}</span>
          </div>
        `;
      }
      html += '</div></div>';
    }

    logEl.innerHTML = html;
  }

  /**
   * Update records display
   */
  updateRecords() {
    const r = this.world.records;

    document.getElementById('record-max-fitness').textContent = r.maxFitness.toFixed(1);
    document.getElementById('record-max-fitness-gen').textContent = `Gen ${r.maxFitnessGen}`;

    document.getElementById('record-best-avg').textContent = r.bestAvgFitness.toFixed(1);
    document.getElementById('record-best-avg-gen').textContent = `Gen ${r.bestAvgFitnessGen}`;

    document.getElementById('record-most-kills').textContent = r.mostKills;
    document.getElementById('record-most-kills-gen').textContent = `Gen ${r.mostKillsGen}`;
  }
}
