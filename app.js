// Tampa Pro Sourdough Tracker - Advanced Professional Application

// Global Application State
let currentView = 'dashboard';
let currentStep = 1;
let selectedFormula = null;
let currentBake = null;
let activeTimers = {};
let environmentLogs = [];
let bakeHistory = [];
let formulas = [];
let settings = {};
let deferredPrompt = null;
let notificationPermission = false;

// Professional Formulas Database
const defaultFormulas = [
  {
    id: 1,
    name: "Tampa Country Levain 78%",
    complexity: "Advanced",
    totalDoughG: 942,
    hydrationPercent: 78,
    saltPercent: 2.1,
    levainPercent: 23.4,
    flourComposition: {
      breadFlour: 80,
      wholeWheat: 15,
      rye: 5
    },
    tampaAdjustments: {
      bulkReduction: 25,
      levainReduction: 2,
      saltIncrease: 0.1
    },
    notes: "Optimized for Tampa heat - reduced levain percentage, shorter bulk time"
  },
  {
    id: 2,
    name: "High-Extraction Tampa Sourdough",
    complexity: "Expert",
    totalDoughG: 1200,
    hydrationPercent: 82,
    saltPercent: 2.0,
    levainPercent: 20,
    flourComposition: {
      highExtraction: 40,
      breadFlour: 45,
      wholeWheat: 10,
      rye: 5
    },
    notes: "For experienced bakers - handle carefully in humidity"
  }
];

// Default Settings
const defaultSettings = {
  defaultAmbientTemp: 76,
  defaultHumidity: 68,
  summerMode: 'auto',
  enableNotifications: true,
  enableFoldReminders: true,
  theme: 'light'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  loadSettings();
  loadFormulas();
  loadBakeHistory();
  loadCurrentBake();
  updateDashboard();
  updateClimatePanel();
  setupCalculatorListeners();
  showView('dashboard');
}

// Data Management
function loadSettings() {
  const saved = localStorage.getItem('sourdough-settings');
  settings = saved ? JSON.parse(saved) : defaultSettings;
  applySettings();
}

function saveSettings() {
  localStorage.setItem('sourdough-settings', JSON.stringify(settings));
}

function loadFormulas() {
  const saved = localStorage.getItem('sourdough-formulas');
  formulas = saved ? JSON.parse(saved) : defaultFormulas;
  updateFormulasView();
}

function saveFormulas() {
  localStorage.setItem('sourdough-formulas', JSON.stringify(formulas));
}

function loadBakeHistory() {
  const saved = localStorage.getItem('sourdough-history');
  bakeHistory = saved ? JSON.parse(saved) : [];
  updateHistoryView();
}

function saveBakeHistory() {
  localStorage.setItem('sourdough-history', JSON.stringify(bakeHistory));
}

function loadCurrentBake() {
  const saved = localStorage.getItem('sourdough-current-bake');
  currentBake = saved ? JSON.parse(saved) : null;
  if (currentBake) {
    updateActiveTimers();
  }
}

function saveCurrentBake() {
  if (currentBake) {
    localStorage.setItem('sourdough-current-bake', JSON.stringify(currentBake));
  } else {
    localStorage.removeItem('sourdough-current-bake');
  }
}

// View Management
function showView(viewName) {
  // Hide all views
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.remove('active'));
  
  // Show selected view
  const targetView = document.getElementById(viewName + '-view');
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // Update navigation
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach(btn => btn.classList.remove('active'));
  
  const activeNavBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeNavBtn) {
    activeNavBtn.classList.add('active');
  }
  
  currentView = viewName;
  
  // Update view-specific content
  switch(viewName) {
    case 'dashboard':
      updateDashboard();
      break;
    case 'formulas':
      updateFormulasView();
      break;
    case 'history':
      updateHistoryView();
      break;
    case 'settings':
      updateSettingsView();
      break;
  }
}

// Dashboard Functions
function updateDashboard() {
  updateQuickStats();
  updateActiveTimers();
  updateRecentActivity();
}

function updateQuickStats() {
  const totalBakes = bakeHistory.length;
  const completedBakes = bakeHistory.filter(bake => bake.status === 'completed');
  const successRate = totalBakes > 0 ? Math.round((completedBakes.length / totalBakes) * 100) : 0;
  const avgRating = completedBakes.length > 0 ? 
    (completedBakes.reduce((sum, bake) => sum + (bake.rating || 0), 0) / completedBakes.length).toFixed(1) : '0.0';
  const activeBakes = currentBake ? 1 : 0;
  
  document.getElementById('total-bakes').textContent = totalBakes;
  document.getElementById('success-rate').textContent = successRate + '%';
  document.getElementById('avg-rating').textContent = avgRating;
  document.getElementById('active-count').textContent = activeBakes;
}

function updateActiveTimers() {
  const container = document.getElementById('active-timers');
  
  if (currentBake && currentBake.status === 'active') {
    container.innerHTML = `
      <div class="timer-card">
        <div class="timer-time" id="main-timer-display">00:00:00</div>
        <div class="timer-label">${currentBake.currentStage || 'Bulk Fermentation'}</div>
        <button class="btn btn-primary" onclick="showView('active-bake')">View Active Bake</button>
      </div>
    `;
    startMainTimer();
  } else {
    container.innerHTML = `
      <div class="alert alert-info">
        <p>No active fermentation. Ready to start your next bake?</p>
      </div>
    `;
  }
}

function updateRecentActivity() {
  const container = document.getElementById('recent-activity-list');
  const recentItems = bakeHistory.slice(-5).reverse();
  
  if (recentItems.length === 0) {
    container.innerHTML = `
      <li class="list-item">
        <div class="item-title">No baking history yet</div>
        <div class="item-subtitle">Start your first bake to see activity here</div>
      </li>
    `;
    return;
  }
  
  container.innerHTML = recentItems.map(bake => `
    <li class="list-item">
      <div class="item-title">${bake.name}</div>
      <div class="item-subtitle">${formatDate(bake.date)} - ${bake.status}</div>
    </li>
  `).join('');
}

function updateClimatePanel() {
  // Simulate Tampa weather (in a real app, this would be from an API)
  const temp = 84 + Math.floor(Math.random() * 6) - 3; // 81-87°F
  const humidity = 75 + Math.floor(Math.random() * 10) - 5; // 70-80%
  const fermentationRate = temp > 80 ? '+25%' : temp > 75 ? '+15%' : 'normal';
  
  document.getElementById('current-temp').textContent = temp + '°F';
  document.getElementById('current-humidity').textContent = humidity + '%';
  document.getElementById('fermentation-rate').textContent = fermentationRate + ' faster';
}

// New Bake Wizard
function startNewBake() {
  showView('new-bake');
  resetBakeWizard();
}

function resetBakeWizard() {
  currentStep = 1;
  selectedFormula = null;
  updateProgressSteps();
  showBakeStep(1);
}

function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep < 4) {
      currentStep++;
      updateProgressSteps();
      showBakeStep(currentStep);
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateProgressSteps();
    showBakeStep(currentStep);
  }
}

function updateProgressSteps() {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNum < currentStep) {
      step.classList.add('completed');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
    }
  });
}

function showBakeStep(stepNum) {
  // Hide all steps
  const steps = document.querySelectorAll('.bake-step');
  steps.forEach(step => step.classList.remove('active'));
  
  // Show current step
  const currentStepEl = document.getElementById(`step-${stepNum}`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }
  
  // Update step-specific content
  switch(stepNum) {
    case 1:
      updateFormulaSelect();
      break;
    case 2:
      calculateTiming();
      break;
    case 3:
      loadEnvironmentDefaults();
      break;
    case 4:
      generateBakeSummary();
      break;
  }
}

function validateCurrentStep() {
  switch(currentStep) {
    case 1:
      const formulaSelect = document.getElementById('formula-select');
      if (!formulaSelect.value) {
        alert('Please select a formula');
        return false;
      }
      selectedFormula = formulas.find(f => f.id == formulaSelect.value);
      return true;
    case 2:
      const targetTime = document.getElementById('target-bake-time');
      if (!targetTime.value) {
        alert('Please set a target bake time');
        return false;
      }
      return true;
    case 3:
      return true; // Environment step is optional
    default:
      return true;
  }
}

function updateFormulaSelect() {
  const select = document.getElementById('formula-select');
  select.innerHTML = '<option value="">-- Select Formula --</option>';
  
  formulas.forEach(formula => {
    const option = document.createElement('option');
    option.value = formula.id;
    option.textContent = formula.name;
    select.appendChild(option);
  });
  
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Create New Formula';
  select.appendChild(customOption);
  
  // Add event listener for formula selection
  select.addEventListener('change', function() {
    if (this.value && this.value !== 'custom') {
      showFormulaDetails(this.value);
    } else if (this.value === 'custom') {
      showView('formulas');
    }
  });
}

function showFormulaDetails(formulaId) {
  const formula = formulas.find(f => f.id == formulaId);
  if (!formula) return;
  
  const detailsContainer = document.getElementById('formula-details');
  
  // Calculate weights
  const calculations = calculateWeights(formula.totalDoughG, formula.hydrationPercent, formula.saltPercent, formula.levainPercent);
  
  detailsContainer.innerHTML = `
    <div class="formula-preview">
      <h4>${formula.name}</h4>
      <div class="formula-stats">
        <div class="stat-item">
          <strong>Total Weight:</strong> ${formula.totalDoughG}g
        </div>
        <div class="stat-item">
          <strong>Hydration:</strong> ${formula.hydrationPercent}%
        </div>
        <div class="stat-item">
          <strong>Salt:</strong> ${formula.saltPercent}%
        </div>
        <div class="stat-item">
          <strong>Levain:</strong> ${formula.levainPercent}%
        </div>
      </div>
      <div class="calculated-weights">
        <h5>Calculated Weights:</h5>
        <div class="weights-grid">
          <div class="weight-item">Flour: ${calculations.flour}g</div>
          <div class="weight-item">Water: ${calculations.water}g</div>
          <div class="weight-item">Salt: ${calculations.salt}g</div>
          <div class="weight-item">Levain: ${calculations.levain}g</div>
        </div>
      </div>
      <p class="formula-notes">${formula.notes}</p>
    </div>
  `;
  
  detailsContainer.style.display = 'block';
}

function calculateTiming() {
  if (!selectedFormula) return;
  
  const targetTime = document.getElementById('target-bake-time').value;
  const currentTemp = parseFloat(document.getElementById('current-temp').value) || 78;
  
  if (!targetTime) return;
  
  const target = new Date(targetTime);
  const now = new Date();
  
  // Calculate timing based on Tampa temperature adjustments
  const tempAdjustment = getTempAdjustment(currentTemp);
  const baseBulkHours = 4.5;
  const baseProofHours = 3.0;
  
  const adjustedBulkHours = baseBulkHours * tempAdjustment;
  const adjustedProofHours = baseProofHours * tempAdjustment;
  
  const totalHours = adjustedBulkHours + adjustedProofHours;
  const startTime = new Date(target.getTime() - (totalHours * 60 * 60 * 1000));
  const bulkEndTime = new Date(startTime.getTime() + (adjustedBulkHours * 60 * 60 * 1000));
  
  const resultsContainer = document.getElementById('timing-results');
  resultsContainer.innerHTML = `
    <div class="timing-schedule">
      <h4>Calculated Schedule</h4>
      <div class="schedule-item">
        <strong>Start Bulk:</strong> ${formatTime(startTime)}
      </div>
      <div class="schedule-item">
        <strong>End Bulk:</strong> ${formatTime(bulkEndTime)}
      </div>
      <div class="schedule-item">
        <strong>Start Proof:</strong> ${formatTime(bulkEndTime)}
      </div>
      <div class="schedule-item">
        <strong>Bake Time:</strong> ${formatTime(target)}
      </div>
      <div class="schedule-note">
        <small>Adjusted for ${currentTemp}°F (${Math.round(tempAdjustment * 100)}% of base timing)</small>
      </div>
    </div>
  `;
}

function getTempAdjustment(temp) {
  // Temperature adjustment factor for Tampa conditions
  if (temp >= 82) return 0.75; // 25% faster
  if (temp >= 78) return 0.85; // 15% faster
  if (temp >= 74) return 1.0;  // Normal
  return 1.15; // 15% slower for cooler conditions
}

function loadEnvironmentDefaults() {
  document.getElementById('ambient-temp').value = settings.defaultAmbientTemp;
  document.getElementById('ambient-humidity').value = settings.defaultHumidity;
}

function generateBakeSummary() {
  if (!selectedFormula) return;
  
  const targetTime = document.getElementById('target-bake-time').value;
  const ambientTemp = document.getElementById('ambient-temp').value;
  const humidity = document.getElementById('ambient-humidity').value;
  
  const summaryContainer = document.getElementById('bake-summary');
  summaryContainer.innerHTML = `
    <div class="bake-summary-content">
      <h4>Bake Summary</h4>
      <div class="summary-item">
        <strong>Formula:</strong> ${selectedFormula.name}
      </div>
      <div class="summary-item">
        <strong>Target Bake Time:</strong> ${formatTime(new Date(targetTime))}
      </div>
      <div class="summary-item">
        <strong>Environment:</strong> ${ambientTemp}°F, ${humidity}% humidity
      </div>
      <div class="summary-item">
        <strong>Total Dough:</strong> ${selectedFormula.totalDoughG}g
      </div>
      <div class="alert alert-info">
        <p>Ready to start your bake! Timers will begin automatically.</p>
      </div>
    </div>
  `;
}

function startBake() {
  if (!selectedFormula) return;
  
  // Create new bake object
  currentBake = {
    id: Date.now(),
    name: selectedFormula.name + ' - ' + formatDate(new Date()),
    formula: selectedFormula,
    startTime: new Date(),
    status: 'active',
    currentStage: 'Bulk Fermentation',
    targetTime: new Date(document.getElementById('target-bake-time').value),
    environment: {
      ambientTemp: parseFloat(document.getElementById('ambient-temp').value),
      humidity: parseFloat(document.getElementById('ambient-humidity').value),
      acStatus: document.getElementById('ac-status').value
    },
    logs: []
  };
  
  saveCurrentBake();
  scheduleStageNotifications();
  showView('active-bake');
  updateActiveBakeView();
  startMainTimer();
}

// Active Bake Management
function updateActiveBakeView() {
  if (!currentBake) {
    showView('dashboard');
    return;
  }
  
  updateCurrentStageDisplay();
  updateMainTimerDisplay();
  updateCurrentBakeLogs();
}

function updateCurrentStageDisplay() {
  const container = document.getElementById('current-stage');
  container.innerHTML = `
    <div class="stage-info">
      <h3>${currentBake.name}</h3>
      <div class="stage-details">
        <div class="detail-item">
          <strong>Current Stage:</strong> ${currentBake.currentStage}
        </div>
        <div class="detail-item">
          <strong>Started:</strong> ${formatTime(new Date(currentBake.startTime))}
        </div>
        <div class="detail-item">
          <strong>Target Bake:</strong> ${formatTime(new Date(currentBake.targetTime))}
        </div>
      </div>
    </div>
  `;
}

function startMainTimer() {
  if (activeTimers.main) {
    clearInterval(activeTimers.main);
  }
  
  activeTimers.main = setInterval(updateMainTimerDisplay, 1000);
}

function updateMainTimerDisplay() {
  if (!currentBake) return;
  
  const now = new Date();
  const start = new Date(currentBake.startTime);
  const elapsed = Math.floor((now - start) / 1000);
  
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const timerDisplay = document.getElementById('timer-display');
  const dashboardTimer = document.getElementById('main-timer-display');
  
  if (timerDisplay) timerDisplay.textContent = timeString;
  if (dashboardTimer) dashboardTimer.textContent = timeString;
}

function pauseTimer() {
  if (activeTimers.main) {
    clearInterval(activeTimers.main);
    activeTimers.main = null;
    document.getElementById('pause-btn').innerHTML = '▶️ Resume';
    document.getElementById('pause-btn').onclick = resumeTimer;
  }
}

function resumeTimer() {
  startMainTimer();
  document.getElementById('pause-btn').innerHTML = '⏸️ Pause';
  document.getElementById('pause-btn').onclick = pauseTimer;
}

function showLogForm() {
  const form = document.getElementById('log-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  
  // Pre-fill with current environment
  if (currentBake) {
    document.getElementById('log-ambient-temp').value = currentBake.environment.ambientTemp;
    document.getElementById('log-humidity').value = currentBake.environment.humidity;
  }
}

function hideLogForm() {
  document.getElementById('log-form').style.display = 'none';
}

function saveLog() {
  if (!currentBake) return;
  
  const log = {
    timestamp: new Date(),
    doughTemp: parseFloat(document.getElementById('log-dough-temp').value),
    ambientTemp: parseFloat(document.getElementById('log-ambient-temp').value),
    humidity: parseFloat(document.getElementById('log-humidity').value),
    risePercentage: parseInt(document.getElementById('log-rise').value),
    notes: document.getElementById('log-notes').value
  };
  
  currentBake.logs.push(log);
  saveCurrentBake();
  updateCurrentBakeLogs();
  hideLogForm();
  
  // Clear form
  document.getElementById('log-dough-temp').value = '';
  document.getElementById('log-notes').value = '';
}

function updateCurrentBakeLogs() {
  if (!currentBake) return;
  
  const container = document.getElementById('current-bake-logs');
  const logs = currentBake.logs.slice(-5).reverse(); // Show last 5 logs
  
  if (logs.length === 0) {
    container.innerHTML = `
      <li class="list-item">
        <div class="item-title">No logs yet</div>
        <div class="item-subtitle">Add your first environment log</div>
      </li>
    `;
    return;
  }
  
  container.innerHTML = logs.map(log => `
    <li class="list-item">
      <div class="item-title">${formatTime(new Date(log.timestamp))}</div>
      <div class="item-subtitle">
        Dough: ${log.doughTemp}°F, Ambient: ${log.ambientTemp}°F, 
        Rise: ${log.risePercentage}%
        ${log.notes ? ' - ' + log.notes : ''}
      </div>
    </li>
  `).join('');
}

function nextStage() {
  if (!currentBake) return;
  
  // Logic to advance to next stage
  switch(currentBake.currentStage) {
    case 'Bulk Fermentation':
      currentBake.currentStage = 'Pre-shape';
      break;
    case 'Pre-shape':
      currentBake.currentStage = 'Final Proof';
      break;
    case 'Final Proof':
      currentBake.currentStage = 'Baking';
      break;
    case 'Baking':
      completeBake();
      return;
  }
  
  saveCurrentBake();
  updateCurrentStageDisplay();
  document.getElementById('timer-label').textContent = currentBake.currentStage;
}

function completeBake() {
  if (!currentBake) return;
  
  // Move to completed bakes
  currentBake.status = 'completed';
  currentBake.endTime = new Date();
  bakeHistory.push(currentBake);
  
  // Clear active bake
  currentBake = null;
  
  // Save data
  saveBakeHistory();
  saveCurrentBake();
  
  // Clear timer
  if (activeTimers.main) {
    clearInterval(activeTimers.main);
    activeTimers.main = null;
  }
  
  // Return to dashboard
  showView('dashboard');
  updateDashboard();
}

// Formula Calculator
function setupCalculatorListeners() {
  const inputs = ['calc-total-weight', 'calc-hydration', 'calc-salt', 'calc-levain'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateCalculations);
    }
  });
}

function updateCalculations() {
  const totalWeight = parseFloat(document.getElementById('calc-total-weight').value) || 0;
  const hydration = parseFloat(document.getElementById('calc-hydration').value) || 0;
  const salt = parseFloat(document.getElementById('calc-salt').value) || 0;
  const levain = parseFloat(document.getElementById('calc-levain').value) || 0;
  
  const calculations = calculateWeights(totalWeight, hydration, salt, levain);
  
  document.getElementById('result-flour').textContent = calculations.flour + 'g';
  document.getElementById('result-water').textContent = calculations.water + 'g';
  document.getElementById('result-salt').textContent = calculations.salt + 'g';
  document.getElementById('result-levain').textContent = calculations.levain + 'g';
}

function calculateWeights(totalWeight, hydrationPercent, saltPercent, levainPercent) {
  const flour = Math.round(totalWeight / (1 + hydrationPercent/100 + saltPercent/100));
  const water = Math.round(flour * hydrationPercent / 100);
  const salt = Math.round(flour * saltPercent / 100);
  const levain = Math.round(flour * levainPercent / 100);
  
  return { flour, water, salt, levain };
}

function saveAsFormula() {
  const name = prompt('Formula name:');
  if (!name) return;
  
  const totalWeight = parseFloat(document.getElementById('calc-total-weight').value);
  const hydration = parseFloat(document.getElementById('calc-hydration').value);
  const salt = parseFloat(document.getElementById('calc-salt').value);
  const levain = parseFloat(document.getElementById('calc-levain').value);
  
  const newFormula = {
    id: Date.now(),
    name: name,
    totalDoughG: totalWeight,
    hydrationPercent: hydration,
    saltPercent: salt,
    levainPercent: levain,
    notes: 'Custom formula created in calculator'
  };
  
  formulas.push(newFormula);
  saveFormulas();
  updateFormulasView();
}

function updateFormulasView() {
  const container = document.getElementById('formulas-list');

  if (formulas.length === 0) {
    container.innerHTML = `
      <li class="list-item">
        <div class="item-title">No saved formulas</div>
        <div class="item-subtitle">Use the calculator above to create your first formula</div>
      </li>
    `;
    return;
  }

  container.innerHTML = formulas.map(formula => `
    <li class="list-item">
      <div class="item-content">
        <div class="item-title">${formula.name}</div>
        <div class="item-subtitle">
          ${formula.totalDoughG}g total, ${formula.hydrationPercent}% hydration,
          ${formula.saltPercent}% salt, ${formula.levainPercent}% levain
        </div>
      </div>
      <button class="btn-icon" onclick="shareRecipe(${formula.id})" title="Share recipe">📤</button>
    </li>
  `).join('');
}

function updateHistoryView() {
  updateHistoryStats();
  updateHistoryList();
}

function updateHistoryStats() {
  const total = bakeHistory.length;
  const completed = bakeHistory.filter(b => b.status === 'completed');
  const successRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const avgRating = completed.length > 0 ? 
    (completed.reduce((sum, bake) => sum + (bake.rating || 0), 0) / completed.length).toFixed(1) : '0.0';
  
  document.getElementById('history-total').textContent = total;
  document.getElementById('history-success').textContent = successRate + '%';
  document.getElementById('history-avg-rating').textContent = avgRating;
  document.getElementById('history-improvement').textContent = '+0%'; // Placeholder for trend analysis
}

function updateHistoryList() {
  const container = document.getElementById('history-list');
  const recentBakes = bakeHistory.slice(-10).reverse();

  if (recentBakes.length === 0) {
    container.innerHTML = `
      <li class="list-item">
        <div class="item-title">No baking history</div>
        <div class="item-subtitle">Start your first bake to build your history</div>
      </li>
    `;
    return;
  }

  container.innerHTML = recentBakes.map(bake => `
    <li class="list-item">
      <div class="item-content">
        <div class="item-title">${bake.name}</div>
        <div class="item-subtitle">
          ${formatDate(bake.startTime)} - ${bake.status}
          ${bake.rating ? ' - ' + '⭐'.repeat(bake.rating) : ''}
        </div>
      </div>
      ${bake.status === 'completed' ? `<button class="btn-icon" onclick="shareBakeResult(${bake.id})" title="Share bake result">📤</button>` : ''}
    </li>
  `).join('');
}

function updateSettingsView() {
  document.getElementById('default-ambient').value = settings.defaultAmbientTemp;
  document.getElementById('default-humidity').value = settings.defaultHumidity;
  document.getElementById('summer-mode').value = settings.summerMode;
  document.getElementById('enable-notifications').checked = settings.enableNotifications;
  document.getElementById('enable-fold-reminders').checked = settings.enableFoldReminders;
}

// Settings Functions
function applySettings() {
  document.body.setAttribute('data-theme', settings.theme);
}

function toggleTheme() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light';
  applySettings();
  saveSettings();
}

function exportData() {
  const data = {
    formulas: formulas,
    history: bakeHistory,
    settings: settings,
    exportDate: new Date()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sourdough-data-' + formatDate(new Date()) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    localStorage.clear();
    formulas = [...defaultFormulas];
    bakeHistory = [];
    currentBake = null;
    settings = {...defaultSettings};
    
    saveFormulas();
    saveBakeHistory();
    saveSettings();
    
    showView('dashboard');
    updateDashboard();
  }
}

// Utility Functions
function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize calculator on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCalculations();
  setupPWAInstallPrompt();
  requestNotificationPermission();
});

// ===== SHARING & SOCIAL FEATURES =====

// Share a recipe using Web Share API (perfect for iPhone)
async function shareRecipe(formulaId) {
  const formula = formulas.find(f => f.id == formulaId);
  if (!formula) return;

  const calculations = calculateWeights(formula.totalDoughG, formula.hydrationPercent, formula.saltPercent, formula.levainPercent);

  const recipeText = `🍞 ${formula.name}

📊 Recipe Details:
• Total: ${formula.totalDoughG}g
• Hydration: ${formula.hydrationPercent}%
• Salt: ${formula.saltPercent}%
• Levain: ${formula.levainPercent}%

⚖️ Weights:
• Flour: ${calculations.flour}g
• Water: ${calculations.water}g
• Salt: ${calculations.salt}g
• Levain: ${calculations.levain}g

${formula.notes ? '📝 Notes: ' + formula.notes : ''}

Shared from Tampa Pro Sourdough Tracker`;

  // Check if Web Share API is available (iOS Safari supports this)
  if (navigator.share) {
    try {
      await navigator.share({
        title: formula.name,
        text: recipeText
      });
      console.log('Recipe shared successfully');
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        copyRecipeToClipboard(recipeText);
      }
    }
  } else {
    // Fallback: copy to clipboard
    copyRecipeToClipboard(recipeText);
  }
}

// Copy recipe to clipboard as fallback
function copyRecipeToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Recipe copied to clipboard! You can paste and share it.');
    }).catch(() => {
      // Fallback to old method
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

// Fallback clipboard copy for older browsers
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    alert('Recipe copied to clipboard! You can paste and share it.');
  } catch (err) {
    alert('Unable to copy recipe. Please select and copy manually.');
  }

  document.body.removeChild(textArea);
}

// Share a completed bake
async function shareBakeResult(bakeId) {
  const bake = bakeHistory.find(b => b.id === bakeId);
  if (!bake) return;

  const duration = bake.endTime ? Math.round((new Date(bake.endTime) - new Date(bake.startTime)) / (1000 * 60 * 60)) : 0;

  const bakeText = `🍞 Just finished baking: ${bake.name}

⏱️ Fermentation Time: ${duration} hours
🌡️ Ambient: ${bake.environment.ambientTemp}°F
💧 Humidity: ${bake.environment.humidity}%
${bake.rating ? '⭐ Rating: ' + '★'.repeat(bake.rating) + '☆'.repeat(5 - bake.rating) : ''}

Tracked with Tampa Pro Sourdough Tracker`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'My Sourdough Bake',
        text: bakeText
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyRecipeToClipboard(bakeText);
      }
    }
  } else {
    copyRecipeToClipboard(bakeText);
  }
}

// Import a shared recipe
function importRecipe() {
  const recipeText = prompt('Paste the shared recipe text here:');
  if (!recipeText) return;

  try {
    // Parse the recipe text
    const lines = recipeText.split('\n');
    const nameMatch = recipeText.match(/🍞 (.+?)(?:\n|$)/);
    const totalMatch = recipeText.match(/Total: (\d+)g/);
    const hydrationMatch = recipeText.match(/Hydration: ([\d.]+)%/);
    const saltMatch = recipeText.match(/Salt: ([\d.]+)%/);
    const levainMatch = recipeText.match(/Levain: ([\d.]+)%/);
    const notesMatch = recipeText.match(/📝 Notes: (.+?)(?:\n|$)/);

    if (!nameMatch || !totalMatch || !hydrationMatch || !saltMatch || !levainMatch) {
      alert('Invalid recipe format. Please make sure you copied the complete recipe.');
      return;
    }

    const newFormula = {
      id: Date.now(),
      name: nameMatch[1],
      totalDoughG: parseInt(totalMatch[1]),
      hydrationPercent: parseFloat(hydrationMatch[1]),
      saltPercent: parseFloat(saltMatch[1]),
      levainPercent: parseFloat(levainMatch[1]),
      notes: notesMatch ? notesMatch[1] : 'Imported recipe'
    };

    formulas.push(newFormula);
    saveFormulas();
    updateFormulasView();
    alert(`Recipe "${newFormula.name}" imported successfully!`);
    showView('formulas');
  } catch (err) {
    alert('Failed to import recipe. Please check the format and try again.');
  }
}

// ===== PWA INSTALLATION =====

function setupPWAInstallPrompt() {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button or banner
    showInstallBanner();
  });

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode');
  }
}

function showInstallBanner() {
  // Check if we should show the banner (not shown more than once per session)
  if (sessionStorage.getItem('install-banner-shown')) return;

  // For iOS, show instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
    // Show iOS-specific install instructions after a delay
    setTimeout(() => {
      if (confirm('Add Tampa Pro Sourdough to your home screen for the best experience!\n\nTap the Share button (⬆️) then "Add to Home Screen"')) {
        sessionStorage.setItem('install-banner-shown', 'true');
      }
    }, 3000);
  } else if (deferredPrompt) {
    // For Android and other platforms
    setTimeout(() => {
      if (confirm('Install Tampa Pro Sourdough app for easier access?')) {
        installPWA();
      }
      sessionStorage.setItem('install-banner-shown', 'true');
    }, 3000);
  }
}

async function installPWA() {
  if (!deferredPrompt) return;

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('User accepted the install prompt');
  }

  // Clear the deferredPrompt
  deferredPrompt = null;
}

// ===== NOTIFICATIONS =====

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    notificationPermission = true;
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermission = permission === 'granted';
  }
}

function sendNotification(title, body, tag = 'sourdough') {
  if (!notificationPermission || !settings.enableNotifications) return;

  try {
    const notification = new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🍞</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🍞</text></svg>',
      tag: tag,
      vibrate: [200, 100, 200]
    });

    notification.onclick = function() {
      window.focus();
      if (currentBake) {
        showView('active-bake');
      }
      notification.close();
    };
  } catch (err) {
    console.log('Notification error:', err);
  }
}

// Schedule notifications for fermentation stages
function scheduleStageNotifications() {
  if (!currentBake) return;

  const now = Date.now();
  const startTime = new Date(currentBake.startTime).getTime();
  const currentTemp = currentBake.environment.ambientTemp;
  const tempAdjustment = getTempAdjustment(currentTemp);

  // Calculate stage times
  const bulkDuration = 4.5 * 60 * 60 * 1000 * tempAdjustment; // hours to ms
  const proofDuration = 3.0 * 60 * 60 * 1000 * tempAdjustment;

  const bulkEndTime = startTime + bulkDuration;
  const proofEndTime = bulkEndTime + proofDuration;

  // Schedule bulk fermentation reminder (30 min before end)
  const bulkReminderTime = bulkEndTime - (30 * 60 * 1000);
  if (bulkReminderTime > now) {
    setTimeout(() => {
      sendNotification('Bulk Fermentation Almost Done', 'Check your dough in 30 minutes - it should be ready for shaping!', 'bulk-reminder');
    }, bulkReminderTime - now);
  }

  // Schedule bulk end notification
  if (bulkEndTime > now) {
    setTimeout(() => {
      sendNotification('Bulk Fermentation Complete! 🎉', 'Time to pre-shape your dough', 'bulk-complete');
    }, bulkEndTime - now);
  }

  // Schedule proof end notification
  if (proofEndTime > now) {
    setTimeout(() => {
      sendNotification('Final Proof Complete! 🔥', 'Your dough is ready to bake!', 'proof-complete');
    }, proofEndTime - now);
  }

  // Fold reminders during bulk (every 30 minutes for first 2 hours)
  if (settings.enableFoldReminders) {
    for (let i = 1; i <= 4; i++) {
      const foldTime = startTime + (i * 30 * 60 * 1000);
      if (foldTime > now && foldTime < bulkEndTime) {
        setTimeout(() => {
          sendNotification('Time for a Fold', `Fold #${i} - Stretch and fold your dough`, 'fold-' + i);
        }, foldTime - now);
      }
    }
  }
}
