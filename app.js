// Tampa Sourdough Tracker - Main Application JavaScript

// Global state
let currentView = 'dashboard';
let currentStep = 1;
let selectedFormula = null;
let currentBake = null;
let bulkTimer = null;
let proofTimer = null;
let bulkStartTime = null;
let proofStartTime = null;
let bulkPaused = false;
let proofPaused = false;
let selectedRating = 0;

// Initial data from JSON
const initialData = {
  "formulas": [
    {
      "id": 1,
      "name": "Tampa Country 75%",
      "total_dough_g": 900,
      "hydration_percent": 75,
      "salt_percent": 2.2,
      "inoculation_percent": 20,
      "levain_hydration_percent": 100,
      "flour_mix": "Bread Flour 85%, Whole Wheat 15%",
      "notes": "Perfect for Tampa's warm climate - reduces bulk time"
    },
    {
      "id": 2,
      "name": "High Hydration Tampa",
      "total_dough_g": 800,
      "hydration_percent": 80,
      "salt_percent": 2.0,
      "inoculation_percent": 25,
      "levain_hydration_percent": 100,
      "flour_mix": "Bread Flour 90%, Whole Wheat 10%",
      "notes": "For experienced bakers - handle carefully in humidity"
    }
  ],
  "starter_feedings": [
    {
      "id": 1,
      "name": "Saturday Evening Feed",
      "datetime": "2025-08-09T19:00:00",
      "flour_g": 50,
      "water_g": 50,
      "flour_type": "Bread Flour",
      "starter_added_g": 50,
      "temp_f": 75.0,
      "rise_observation": "Good (~2x)",
      "notes": "Peaked after 8 hours - perfect timing"
    }
  ],
  "levain_builds": [
    {
      "id": 1,
      "name": "Sunday Morning Levain",
      "start_time": "2025-08-10T06:00:00",
      "ready_time": "2025-08-10T10:00:00",
      "hydration_percent": 100,
      "inoculation_percent": 20,
      "flour_mix": "Bread Flour 80%, Whole Wheat 20%",
      "temp_f": 76.0,
      "signs_ready": ["Domed", "Float Test ✓"],
      "notes": "Ready right on schedule - domed and bubbly",
      "for_bake_id": 1
    }
  ],
  "bakes": [
    {
      "id": 1,
      "name": "Weekend Tampa Loaf",
      "date": "2025-08-10",
      "formula_id": 1,
      "levain_build_id": 1,
      "starter_feeding_id": 1,
      "target_weight_g": 900,
      "bulk_start": "2025-08-10T10:15:00",
      "bulk_end": "2025-08-10T14:00:00",
      "bulk_temp_f": 76.5,
      "folds": "4 coil folds every 30 minutes",
      "proof_method": "Cold",
      "proof_start": "2025-08-10T14:15:00",
      "proof_end": "2025-08-11T06:00:00",
      "bake_temp_f": 485,
      "covered_minutes": 20,
      "uncovered_minutes": 18,
      "steam_method": "Dutch Oven",
      "rating": 4,
      "issues": ["Slight overproof"],
      "notes": "Great oven spring and open crumb. AC kept temps stable.",
      "photos": [],
      "status": "completed"
    }
  ],
  "environment_logs": [
    {
      "id": 1,
      "bake_id": 1,
      "time": "2025-08-10T10:45:00",
      "ambient_temp_f": 75.0,
      "dough_temp_f": 76.0,
      "humidity_percent": 65,
      "notes": "First fold - dough feels good"
    },
    {
      "id": 2,
      "bake_id": 1,
      "time": "2025-08-10T13:30:00",
      "ambient_temp_f": 76.0,
      "dough_temp_f": 76.5,
      "humidity_percent": 68,
      "notes": "End of bulk - good jiggle test"
    }
  ],
  "common_issues": [
    "Overproofed",
    "Underproofed", 
    "Dense crumb",
    "Weak ear",
    "Gummy texture",
    "Flat loaf",
    "Tearing",
    "Great ear"
  ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    initializeData();
    loadDashboard();
    initializeTimers();
    populateIssueCheckboxes();
    updateClimateDisplay();
    setupRatingStars();
    
    // Set current datetime for levain inputs
    const now = new Date();
    const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const levainStart = document.getElementById('levain-start');
    if (levainStart) {
        levainStart.value = localISOTime;
    }
    
    // Set ready time to 4 hours later
    const readyTime = new Date(now.getTime() + 4 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000);
    const levainReady = document.getElementById('levain-ready');
    if (levainReady) {
        levainReady.value = readyTime.toISOString().slice(0, 16);
    }
    
    console.log('App initialized successfully');
});

// Data Management
function initializeData() {
    // Initialize localStorage with sample data if empty
    if (!localStorage.getItem('sourdough_formulas')) {
        localStorage.setItem('sourdough_formulas', JSON.stringify(initialData.formulas));
    }
    if (!localStorage.getItem('sourdough_starter_feedings')) {
        localStorage.setItem('sourdough_starter_feedings', JSON.stringify(initialData.starter_feedings));
    }
    if (!localStorage.getItem('sourdough_levain_builds')) {
        localStorage.setItem('sourdough_levain_builds', JSON.stringify(initialData.levain_builds));
    }
    if (!localStorage.getItem('sourdough_bakes')) {
        localStorage.setItem('sourdough_bakes', JSON.stringify(initialData.bakes));
    }
    if (!localStorage.getItem('sourdough_environment_logs')) {
        localStorage.setItem('sourdough_environment_logs', JSON.stringify(initialData.environment_logs));
    }
}

function getData(key) {
    try {
        const data = localStorage.getItem(`sourdough_${key}`);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error getting data for ${key}:`, error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(`sourdough_${key}`, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving data for ${key}:`, error);
    }
}

function getNextId(data) {
    return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
}

// View Management
function switchView(viewName) {
    console.log('Switching to view:', viewName);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error('View not found:', `${viewName}-view`);
        return;
    }
    
    // Update navigation
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    const navButton = document.querySelector(`[data-view="${viewName}"]`);
    if (navButton) {
        navButton.classList.add('active');
    }
    
    currentView = viewName;
    
    // Load view-specific data
    try {
        switch(viewName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'new-bake':
                resetBakeWizard();
                loadFormulas();
                break;
            case 'formulas':
                loadFormulasView();
                break;
            case 'starter':
                loadStarterView();
                break;
            case 'history':
                loadHistoryView();
                break;
            case 'settings':
                loadSettingsView();
                break;
        }
    } catch (error) {
        console.error('Error loading view:', error);
    }
}

// Dashboard Functions
function loadDashboard() {
    console.log('Loading dashboard...');
    loadActiveBakes();
    loadQuickStats();
    loadRecentActivity();
}

function loadActiveBakes() {
    const bakes = getData('bakes');
    const activeBakes = bakes.filter(bake => bake.status !== 'completed');
    const container = document.getElementById('active-bakes-list');
    
    if (!container) {
        console.error('Active bakes container not found');
        return;
    }
    
    if (activeBakes.length === 0) {
        container.innerHTML = '<div class="activity-item"><div class="activity-content"><p class="activity-title">No active bakes</p><p class="activity-time">Start a new bake to track your progress</p></div></div>';
        return;
    }
    
    container.innerHTML = activeBakes.map(bake => `
        <div class="bake-card">
            <div class="bake-card-header">
                <span class="bake-name">${bake.name}</span>
                <span class="bake-status ${bake.status}">${bake.status}</span>
            </div>
            <p>Started: ${new Date(bake.date).toLocaleDateString()}</p>
            <p>Formula: ${getFormulaName(bake.formula_id)}</p>
        </div>
    `).join('');
}

function loadQuickStats() {
    const bakes = getData('bakes');
    const completedBakes = bakes.filter(bake => bake.status === 'completed');
    
    const totalBakesEl = document.getElementById('total-bakes');
    const avgRatingEl = document.getElementById('avg-rating');
    const successRateEl = document.getElementById('success-rate');
    
    if (totalBakesEl) totalBakesEl.textContent = completedBakes.length;
    
    if (completedBakes.length > 0) {
        const avgRating = completedBakes.reduce((sum, bake) => sum + (bake.rating || 0), 0) / completedBakes.length;
        if (avgRatingEl) avgRatingEl.textContent = avgRating.toFixed(1);
        
        const successfulBakes = completedBakes.filter(bake => (bake.rating || 0) >= 4).length;
        const successRate = (successfulBakes / completedBakes.length) * 100;
        if (successRateEl) successRateEl.textContent = `${Math.round(successRate)}%`;
    } else {
        if (avgRatingEl) avgRatingEl.textContent = '0.0';
        if (successRateEl) successRateEl.textContent = '0%';
    }
}

function loadRecentActivity() {
    const bakes = getData('bakes');
    const feedings = getData('starter_feedings');
    const container = document.getElementById('recent-activity-list');
    
    if (!container) {
        console.error('Recent activity container not found');
        return;
    }
    
    const recentBakes = bakes.slice(-3).map(bake => ({
        type: 'bake',
        title: `Completed: ${bake.name}`,
        time: formatRelativeTime(bake.date),
        icon: '🍞'
    }));
    
    const recentFeedings = feedings.slice(-2).map(feeding => ({
        type: 'feeding',
        title: `Fed starter: ${feeding.name}`,
        time: formatRelativeTime(feeding.datetime),
        icon: '🥖'
    }));
    
    const allActivity = [...recentBakes, ...recentFeedings]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);
    
    if (allActivity.length === 0) {
        container.innerHTML = '<div class="activity-item"><div class="activity-content"><p class="activity-title">No recent activity</p></div></div>';
        return;
    }
    
    container.innerHTML = allActivity.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <p class="activity-title">${activity.title}</p>
                <p class="activity-time">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

// Bake Wizard Functions
function resetBakeWizard() {
    console.log('Resetting bake wizard...');
    currentStep = 1;
    selectedFormula = null;
    currentBake = null;
    
    // Reset progress
    const progressBar = document.getElementById('wizard-progress');
    if (progressBar) progressBar.style.width = '20%';
    
    // Reset steps
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add('active');
    
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active', 'completed'));
    const firstStep = document.querySelector('[data-step="1"]');
    if (firstStep) firstStep.classList.add('active');
    
    // Reset form values
    const formulaDetails = document.getElementById('formula-details');
    if (formulaDetails) formulaDetails.style.display = 'none';
    
    clearTimers();
}

function loadFormulas() {
    console.log('Loading formulas for wizard...');
    const formulas = getData('formulas');
    const container = document.getElementById('formula-list');
    
    if (!container) {
        console.error('Formula list container not found');
        return;
    }
    
    container.innerHTML = formulas.map(formula => `
        <div class="formula-card" onclick="selectFormula(${formula.id})">
            <div class="formula-card-header">
                <h3 class="formula-name">${formula.name}</h3>
                <span class="formula-weight">${formula.total_dough_g}g</span>
            </div>
            <div class="formula-specs">
                <div class="spec-item">
                    <span class="spec-label">Hydration</span>
                    <span class="spec-value">${formula.hydration_percent}%</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Salt</span>
                    <span class="spec-value">${formula.salt_percent}%</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Inoculation</span>
                    <span class="spec-value">${formula.inoculation_percent}%</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Levain Hyd.</span>
                    <span class="spec-value">${formula.levain_hydration_percent}%</span>
                </div>
            </div>
            <p class="formula-flour-mix">${formula.flour_mix}</p>
        </div>
    `).join('');
}

function selectFormula(formulaId) {
    console.log('Selecting formula:', formulaId);
    const formulas = getData('formulas');
    selectedFormula = formulas.find(f => f.id === formulaId);
    
    if (!selectedFormula) {
        console.error('Formula not found:', formulaId);
        return;
    }
    
    // Update UI
    document.querySelectorAll('.formula-card').forEach(card => card.classList.remove('selected'));
    const clickedCard = event.target.closest('.formula-card');
    if (clickedCard) {
        clickedCard.classList.add('selected');
    }
    
    // Calculate and display weights
    calculateWeights();
    const formulaDetails = document.getElementById('formula-details');
    if (formulaDetails) {
        formulaDetails.style.display = 'block';
    }
}

function calculateWeights() {
    if (!selectedFormula) return;
    
    const totalDough = selectedFormula.total_dough_g;
    const hydration = selectedFormula.hydration_percent / 100;
    const salt = selectedFormula.salt_percent / 100;
    const inoculation = selectedFormula.inoculation_percent / 100;
    const levainHydration = selectedFormula.levain_hydration_percent / 100;
    
    // Calculate flour in levain
    const levainWeight = totalDough * inoculation;
    const levainFlour = levainWeight / (1 + levainHydration);
    
    // Calculate total flour
    const totalFlour = totalDough / (1 + hydration + salt);
    const finalFlour = totalFlour - levainFlour;
    
    // Calculate water
    const levainWater = levainFlour * levainHydration;
    const totalWater = totalFlour * hydration;
    const finalWater = totalWater - levainWater;
    
    // Calculate salt
    const saltWeight = totalFlour * salt;
    
    // Update display
    const totalFlourEl = document.getElementById('total-flour');
    const waterWeightEl = document.getElementById('water-weight');
    const saltWeightEl = document.getElementById('salt-weight');
    const levainWeightEl = document.getElementById('levain-weight');
    
    if (totalFlourEl) totalFlourEl.textContent = `${Math.round(finalFlour)}g`;
    if (waterWeightEl) waterWeightEl.textContent = `${Math.round(finalWater)}g`;
    if (saltWeightEl) saltWeightEl.textContent = `${Math.round(saltWeight)}g`;
    if (levainWeightEl) levainWeightEl.textContent = `${Math.round(levainWeight)}g`;
}

function nextStep() {
    if (currentStep < 5) {
        // Mark current step as completed
        const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('completed');
            currentStepEl.classList.remove('active');
        }
        
        currentStep++;
        
        // Update progress bar
        const progress = (currentStep / 5) * 100;
        const progressBar = document.getElementById('wizard-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        // Show new step
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
        const nextStepEl = document.getElementById(`step-${currentStep}`);
        if (nextStepEl) {
            nextStepEl.classList.add('active');
        }
        
        // Mark new step as active
        const newStepEl = document.querySelector(`[data-step="${currentStep}"]`);
        if (newStepEl) {
            newStepEl.classList.add('active');
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        // Mark current step as inactive
        const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }
        
        currentStep--;
        
        // Update progress bar
        const progress = (currentStep / 5) * 100;
        const progressBar = document.getElementById('wizard-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        // Show previous step
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
        const prevStepEl = document.getElementById(`step-${currentStep}`);
        if (prevStepEl) {
            prevStepEl.classList.add('active');
        }
        
        // Mark step as active and remove completed
        const stepEl = document.querySelector(`[data-step="${currentStep}"]`);
        if (stepEl) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        }
    }
}

// Timer Functions
function initializeTimers() {
    // Initialize timer displays
    updateTimerDisplay('bulk-timer', 0);
    updateTimerDisplay('proof-timer', 0);
}

function startBulkTimer() {
    bulkStartTime = Date.now();
    bulkPaused = false;
    
    const startBtn = document.getElementById('start-bulk-btn');
    const pauseBtn = document.getElementById('pause-bulk-btn');
    const endBtn = document.getElementById('end-bulk-btn');
    
    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    if (endBtn) endBtn.style.display = 'inline-flex';
    
    const timerDisplay = document.querySelector('#step-3 .timer-display');
    if (timerDisplay) {
        timerDisplay.classList.add('active');
    }
    
    bulkTimer = setInterval(updateBulkTimer, 1000);
}

function pauseBulkTimer() {
    const pauseBtn = document.getElementById('pause-bulk-btn');
    if (bulkPaused) {
        // Resume
        bulkStartTime = Date.now() - (bulkStartTime - Date.now());
        bulkPaused = false;
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        bulkTimer = setInterval(updateBulkTimer, 1000);
    } else {
        // Pause
        clearInterval(bulkTimer);
        bulkPaused = true;
        if (pauseBtn) pauseBtn.textContent = 'Resume';
    }
}

function endBulkFermentation() {
    clearInterval(bulkTimer);
    const timerDisplay = document.querySelector('#step-3 .timer-display');
    if (timerDisplay) {
        timerDisplay.classList.remove('active');
    }
    nextStep(); // Move to proofing step
}

function startProofTimer() {
    proofStartTime = Date.now();
    proofPaused = false;
    
    const startBtn = document.getElementById('start-proof-btn');
    const pauseBtn = document.getElementById('pause-proof-btn');
    const endBtn = document.getElementById('end-proof-btn');
    
    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    if (endBtn) endBtn.style.display = 'inline-flex';
    
    const timerDisplay = document.querySelector('#step-4 .timer-display');
    if (timerDisplay) {
        timerDisplay.classList.add('active');
    }
    
    proofTimer = setInterval(updateProofTimer, 1000);
}

function pauseProofTimer() {
    const pauseBtn = document.getElementById('pause-proof-btn');
    if (proofPaused) {
        // Resume
        proofStartTime = Date.now() - (proofStartTime - Date.now());
        proofPaused = false;
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        proofTimer = setInterval(updateProofTimer, 1000);
    } else {
        // Pause
        clearInterval(proofTimer);
        proofPaused = true;
        if (pauseBtn) pauseBtn.textContent = 'Resume';
    }
}

function endProofing() {
    clearInterval(proofTimer);
    const timerDisplay = document.querySelector('#step-4 .timer-display');
    if (timerDisplay) {
        timerDisplay.classList.remove('active');
    }
    nextStep(); // Move to baking step
}

function updateBulkTimer() {
    if (!bulkPaused) {
        const elapsed = Math.floor((Date.now() - bulkStartTime) / 1000);
        updateTimerDisplay('bulk-timer', elapsed);
    }
}

function updateProofTimer() {
    if (!proofPaused) {
        const elapsed = Math.floor((Date.now() - proofStartTime) / 1000);
        updateTimerDisplay('proof-timer', elapsed);
    }
}

function updateTimerDisplay(elementId, seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const display = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = display;
    }
}

function clearTimers() {
    if (bulkTimer) {
        clearInterval(bulkTimer);
        bulkTimer = null;
    }
    if (proofTimer) {
        clearInterval(proofTimer);
        proofTimer = null;
    }
    
    updateTimerDisplay('bulk-timer', 0);
    updateTimerDisplay('proof-timer', 0);
    
    // Reset timer buttons
    const elements = [
        'start-bulk-btn', 'pause-bulk-btn', 'end-bulk-btn',
        'start-proof-btn', 'pause-proof-btn', 'end-proof-btn'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id.startsWith('start-')) {
                el.style.display = 'inline-flex';
            } else {
                el.style.display = 'none';
            }
        }
    });
}

// Environment Logging
function logEnvironment() {
    const ambientTempEl = document.getElementById('ambient-temp');
    const doughTempEl = document.getElementById('dough-temp');
    const humidityEl = document.getElementById('humidity');
    
    if (!ambientTempEl || !doughTempEl || !humidityEl) {
        console.error('Environment input elements not found');
        return;
    }
    
    const ambientTemp = ambientTempEl.value;
    const doughTemp = doughTempEl.value;
    const humidity = humidityEl.value;
    
    if (!currentBake) {
        // Create a temporary bake record for logging
        currentBake = {
            id: Date.now(), // Temporary ID
            temp_log: []
        };
    }
    
    const logEntry = {
        time: new Date().toISOString(),
        ambient_temp_f: parseFloat(ambientTemp),
        dough_temp_f: parseFloat(doughTemp),
        humidity_percent: parseInt(humidity),
        notes: 'Environment check during bulk fermentation'
    };
    
    // Add to environment logs
    const envLogs = getData('environment_logs');
    const newLog = {
        id: getNextId(envLogs),
        bake_id: currentBake.id,
        ...logEntry
    };
    envLogs.push(newLog);
    saveData('environment_logs', envLogs);
    
    // Update climate display
    updateClimateDisplay();
    
    alert('Environment logged successfully!');
}

function addFold() {
    const foldLog = document.getElementById('fold-log');
    if (!foldLog) {
        console.error('Fold log container not found');
        return;
    }
    
    const foldCount = foldLog.children.length + 1;
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const foldEntry = document.createElement('div');
    foldEntry.className = 'fold-entry';
    foldEntry.innerHTML = `
        <span class="fold-time">${currentTime}</span>
        <span class="fold-type">Fold ${foldCount}</span>
    `;
    
    foldLog.appendChild(foldEntry);
}

// Rating System
function setupRatingStars() {
    const stars = document.querySelectorAll('.star');
    
    if (stars.length === 0) {
        console.log('Rating stars not found, will setup later');
        return;
    }
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            updateStarDisplay(selectedRating);
        });
        
        star.addEventListener('mouseover', () => {
            updateStarDisplay(index + 1);
        });
    });
    
    const ratingContainer = document.querySelector('.rating-stars');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', () => {
            updateStarDisplay(selectedRating);
        });
    }
    
    function updateStarDisplay(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
}

function populateIssueCheckboxes() {
    const container = document.getElementById('issue-checkboxes');
    if (!container) {
        console.log('Issue checkboxes container not found, will populate later');
        return;
    }
    
    container.innerHTML = initialData.common_issues.map(issue => `
        <label class="checkbox-label">
            <input type="checkbox" value="${issue}">
            <span>${issue}</span>
        </label>
    `).join('');
}

function completeBake() {
    const rating = selectedRating;
    const selectedIssues = Array.from(document.querySelectorAll('#issue-checkboxes input:checked')).map(cb => cb.value);
    const finalNotesEl = document.getElementById('final-notes');
    const ovenTempEl = document.getElementById('oven-temp');
    const coveredTimeEl = document.getElementById('covered-time');
    const uncoveredTimeEl = document.getElementById('uncovered-time');
    const steamMethodEl = document.getElementById('steam-method');
    const proofMethodEl = document.querySelector('input[name="proof-method"]:checked');
    
    const finalNotes = finalNotesEl ? finalNotesEl.value : '';
    const ovenTemp = ovenTempEl ? ovenTempEl.value : '485';
    const coveredTime = coveredTimeEl ? coveredTimeEl.value : '20';
    const uncoveredTime = uncoveredTimeEl ? uncoveredTimeEl.value : '18';
    const steamMethod = steamMethodEl ? steamMethodEl.value : 'Dutch Oven';
    const proofMethod = proofMethodEl ? proofMethodEl.value : 'room';
    
    if (!selectedFormula) {
        alert('No formula selected. Please restart the bake wizard.');
        return;
    }
    
    // Create new bake record
    const bakes = getData('bakes');
    const newBake = {
        id: getNextId(bakes),
        name: `${selectedFormula.name} - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        formula_id: selectedFormula.id,
        target_weight_g: selectedFormula.total_dough_g,
        bulk_start: bulkStartTime ? new Date(bulkStartTime).toISOString() : null,
        bulk_end: new Date().toISOString(),
        proof_method: proofMethod,
        proof_start: proofStartTime ? new Date(proofStartTime).toISOString() : null,
        proof_end: new Date().toISOString(),
        bake_temp_f: parseInt(ovenTemp),
        covered_minutes: parseInt(coveredTime),
        uncovered_minutes: parseInt(uncoveredTime),
        steam_method: steamMethod,
        rating: rating,
        issues: selectedIssues,
        notes: finalNotes,
        photos: [],
        status: 'completed'
    };
    
    bakes.push(newBake);
    saveData('bakes', bakes);
    
    alert('Bake completed successfully!');
    switchView('dashboard');
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showCreateFormula() {
    showModal('create-formula-modal');
}

function saveFormula() {
    const elements = [
        'formula-name', 'total-dough', 'hydration', 'salt-percent',
        'inoculation', 'levain-hydration', 'flour-mix', 'formula-notes'
    ];
    
    const values = {};
    let missingFields = false;
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            values[id] = el.value;
        } else {
            console.error(`Element not found: ${id}`);
            missingFields = true;
        }
    });
    
    if (missingFields || !values['formula-name'] || !values['total-dough']) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const formData = {
        name: values['formula-name'],
        total_dough_g: parseInt(values['total-dough']),
        hydration_percent: parseFloat(values['hydration']),
        salt_percent: parseFloat(values['salt-percent']),
        inoculation_percent: parseFloat(values['inoculation']),
        levain_hydration_percent: parseFloat(values['levain-hydration']),
        flour_mix: values['flour-mix'],
        notes: values['formula-notes']
    };
    
    const formulas = getData('formulas');
    formData.id = getNextId(formulas);
    formulas.push(formData);
    saveData('formulas', formulas);
    
    closeModal('create-formula-modal');
    if (currentView === 'formulas') {
        loadFormulasView();
    } else {
        loadFormulas();
    }
    
    // Reset form
    const form = document.getElementById('formula-form');
    if (form) {
        form.reset();
    }
    
    alert('Formula saved successfully!');
}

function showFeedStarter() {
    // Set default feeding name with current date
    const feedingNameEl = document.getElementById('feeding-name');
    if (feedingNameEl) {
        feedingNameEl.value = `Feeding - ${new Date().toLocaleDateString()}`;
    }
    showModal('feed-starter-modal');
}

function saveFeeding() {
    const elements = [
        'feeding-name', 'starter-added', 'feeding-flour', 'feeding-water',
        'flour-type', 'feeding-temp', 'feeding-notes'
    ];
    
    const values = {};
    let missingFields = false;
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            values[id] = el.value;
        } else {
            console.error(`Element not found: ${id}`);
            missingFields = true;
        }
    });
    
    if (missingFields || !values['feeding-name']) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const feedingData = {
        name: values['feeding-name'],
        datetime: new Date().toISOString(),
        starter_added_g: parseInt(values['starter-added']),
        flour_g: parseInt(values['feeding-flour']),
        water_g: parseInt(values['feeding-water']),
        flour_type: values['flour-type'],
        temp_f: parseFloat(values['feeding-temp']),
        rise_observation: 'Pending observation',
        notes: values['feeding-notes']
    };
    
    const feedings = getData('starter_feedings');
    feedingData.id = getNextId(feedings);
    feedings.push(feedingData);
    saveData('starter_feedings', feedings);
    
    closeModal('feed-starter-modal');
    if (currentView === 'starter') {
        loadStarterView();
    }
    
    // Reset form
    const form = document.getElementById('feeding-form');
    if (form) {
        form.reset();
    }
    
    alert('Feeding saved successfully!');
}

// View-specific loading functions
function loadFormulasView() {
    const formulas = getData('formulas');
    const container = document.getElementById('formulas-list');
    
    if (!container) {
        console.error('Formulas list container not found');
        return;
    }
    
    container.innerHTML = formulas.map(formula => `
        <div class="formula-card">
            <div class="formula-card-header">
                <h3 class="formula-name">${formula.name}</h3>
                <span class="formula-weight">${formula.total_dough_g}g</span>
            </div>
            <div class="formula-specs">
                <div class="spec-item">
                    <span class="spec-label">Hydration</span>
                    <span class="spec-value">${formula.hydration_percent}%</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Salt</span>
                    <span class="spec-value">${formula.salt_percent}%</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Inoculation</span>
                    <span class="spec-value">${formula.inoculation_percent}%</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Levain Hyd.</span>
                    <span class="spec-value">${formula.levain_hydration_percent}%</span>
                </div>
            </div>
            <p class="formula-flour-mix">${formula.flour_mix}</p>
            ${formula.notes ? `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-8);">${formula.notes}</p>` : ''}
        </div>
    `).join('');
}

function loadStarterView() {
    const feedings = getData('starter_feedings');
    const container = document.getElementById('feeding-history');
    
    if (!container) {
        console.error('Feeding history container not found');
        return;
    }
    
    // Update starter health indicators
    if (feedings.length > 0) {
        const lastFeeding = feedings[feedings.length - 1];
        const daysSinceFeeding = Math.floor((Date.now() - new Date(lastFeeding.datetime).getTime()) / (1000 * 60 * 60 * 24));
        
        const lastFedEl = document.getElementById('last-fed');
        const risePerformanceEl = document.getElementById('rise-performance');
        
        if (lastFedEl) {
            lastFedEl.textContent = daysSinceFeeding === 0 ? 'Today' : `${daysSinceFeeding} day${daysSinceFeeding === 1 ? '' : 's'} ago`;
        }
        if (risePerformanceEl) {
            risePerformanceEl.textContent = lastFeeding.rise_observation || 'Not recorded';
        }
    }
    
    container.innerHTML = feedings.slice().reverse().map(feeding => `
        <div class="feeding-entry">
            <div class="feeding-header">
                <h4 class="feeding-name">${feeding.name}</h4>
                <span class="feeding-date">${new Date(feeding.datetime).toLocaleDateString()}</span>
            </div>
            <div class="feeding-details">
                <div class="feeding-detail">
                    <span class="feeding-detail-label">Starter</span>
                    <span class="feeding-detail-value">${feeding.starter_added_g || 50}g</span>
                </div>
                <div class="feeding-detail">
                    <span class="feeding-detail-label">Flour</span>
                    <span class="feeding-detail-value">${feeding.flour_g}g</span>
                </div>
                <div class="feeding-detail">
                    <span class="feeding-detail-label">Water</span>
                    <span class="feeding-detail-value">${feeding.water_g}g</span>
                </div>
            </div>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                ${feeding.flour_type} at ${feeding.temp_f}°F
            </p>
            ${feeding.notes ? `<p style="font-size: var(--font-size-sm); margin-top: var(--space-8);">${feeding.notes}</p>` : ''}
        </div>
    `).join('');
}

function loadHistoryView() {
    const bakes = getData('bakes').filter(bake => bake.status === 'completed');
    const container = document.getElementById('history-list');
    
    if (!container) {
        console.error('History list container not found');
        return;
    }
    
    if (bakes.length === 0) {
        container.innerHTML = '<div class="activity-item"><div class="activity-content"><p class="activity-title">No completed bakes</p><p class="activity-time">Complete your first bake to see it here</p></div></div>';
        return;
    }
    
    container.innerHTML = bakes.slice().reverse().map(bake => `
        <div class="history-item">
            <div class="history-header">
                <h3 class="history-name">${bake.name}</h3>
                <span class="history-date">${new Date(bake.date).toLocaleDateString()}</span>
            </div>
            <div class="history-rating">
                ${Array(5).fill().map((_, i) => 
                    `<span class="history-star ${i < (bake.rating || 0) ? '' : 'empty'}">★</span>`
                ).join('')}
            </div>
            <p>Formula: ${getFormulaName(bake.formula_id)}</p>
            ${bake.issues && bake.issues.length > 0 ? `<p style="font-size: var(--font-size-sm); color: var(--color-warning);">Issues: ${bake.issues.join(', ')}</p>` : ''}
            ${bake.notes ? `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-8);">${bake.notes}</p>` : ''}
        </div>
    `).join('');
}

function loadSettingsView() {
    // Load current settings
    const defaultTemp = localStorage.getItem('default_temp') || '75';
    const defaultHumidity = localStorage.getItem('default_humidity') || '68';
    
    const defaultTempEl = document.getElementById('default-temp');
    const defaultHumidityEl = document.getElementById('default-humidity');
    
    if (defaultTempEl) defaultTempEl.value = defaultTemp;
    if (defaultHumidityEl) defaultHumidityEl.value = defaultHumidity;
}

// Utility Functions
function getFormulaName(formulaId) {
    const formulas = getData('formulas');
    const formula = formulas.find(f => f.id === formulaId);
    return formula ? formula.name : 'Unknown Formula';
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function updateClimateDisplay() {
    const defaultTemp = localStorage.getItem('default_temp') || '75';
    const defaultHumidity = localStorage.getItem('default_humidity') || '68';
    
    const tempDisplay = document.querySelector('.temp-display');
    const humidityDisplay = document.querySelector('.humidity-display');
    
    if (tempDisplay) tempDisplay.textContent = `${defaultTemp}°F`;
    if (humidityDisplay) humidityDisplay.textContent = `${defaultHumidity}%`;
}

function exportData() {
    const data = {
        formulas: getData('formulas'),
        starter_feedings: getData('starter_feedings'),
        levain_builds: getData('levain_builds'),
        bakes: getData('bakes'),
        environment_logs: getData('environment_logs'),
        exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sourdough-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function clearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

// Make functions globally available
window.switchView = switchView;
window.selectFormula = selectFormula;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.startBulkTimer = startBulkTimer;
window.pauseBulkTimer = pauseBulkTimer;
window.endBulkFermentation = endBulkFermentation;
window.startProofTimer = startProofTimer;
window.pauseProofTimer = pauseProofTimer;
window.endProofing = endProofing;
window.logEnvironment = logEnvironment;
window.addFold = addFold;
window.completeBake = completeBake;
window.showCreateFormula = showCreateFormula;
window.closeModal = closeModal;
window.saveFormula = saveFormula;
window.showFeedStarter = showFeedStarter;
window.saveFeeding = saveFeeding;
window.exportData = exportData;
window.clearData = clearData;