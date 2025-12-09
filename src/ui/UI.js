/**
 * UI - Control panel and statistics
 */
export class UI {
  constructor(world, renderer) {
    this.world = world;
    this.renderer = renderer;
    this.container = null;

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
        <p class="ui-subtitle">Neural Network Life Simulation</p>
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
            <span class="stat-label">Food Eaten</span>
            <span class="stat-value" id="stat-food">0</span>
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
        </div>
      </div>
      
      <div class="ui-footer">
        <p>Creatures compete for food</p>
        <p>Best survive and evolve</p>
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
  }

  /**
   * Update UI with current stats
   */
  update() {
    const s = this.world.stats;

    document.getElementById('stat-gen').textContent = s.generation;
    document.getElementById('stat-tick').textContent = s.tick;
    document.getElementById('stat-alive').textContent = s.alive;
    document.getElementById('stat-food').textContent = s.foodEaten;
    document.getElementById('stat-avg-fitness').textContent = s.avgFitness.toFixed(1);
    document.getElementById('stat-max-fitness').textContent = s.maxFitness.toFixed(1);

    // Update chart
    this.drawChart();
  }

  drawChart() {
    const canvas = document.getElementById('chart-canvas');
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const history = this.world.stats.history;

    if (history.length < 2) return;

    // Clear
    ctx.fillStyle = 'rgba(15, 15, 26, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Find max for scaling
    const maxVal = Math.max(...history.map(h => h.maxFitness), 1);
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw average fitness line
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    for (let i = 0; i < history.length; i++) {
      const x = padding + (i / (history.length - 1)) * chartWidth;
      const y = height - padding - (history[i].avgFitness / maxVal) * chartHeight;

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
      const y = height - padding - (history[i].maxFitness / maxVal) * chartHeight;

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
    ctx.fillText('Avg', padding, 15);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('Max', padding + 35, 15);
  }
}
