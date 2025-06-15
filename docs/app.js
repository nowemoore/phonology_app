let allPhonemes = [];
let allFeatures = [];
let selectedAlphabet = [];
let selectedTargets = [];
let selectedFeatures = {}; // {featureName: '+' or '-' or null}
let matchingPhonemes = []; // Phonemes that match selected features
let csvData = []; // Store parsed CSV data

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const stepFeatures = document.getElementById('step-features');
const alphabetDiv = document.getElementById('alphabet-buttons');
const targetDiv = document.getElementById('target-buttons');
const featuresDiv = document.getElementById('features-buttons');
const resultDiv = document.getElementById('result');
const liveResultsDiv = document.getElementById('live-results');

// Display elements
const alphabetDisplay = document.getElementById('alphabet-display');
const alphabetDisplayStep2 = document.getElementById('alphabet-display-step2');
const alphabetDisplayStepFeatures = document.getElementById('alphabet-display-step-features');
const alphabetDisplayStep3 = document.getElementById('alphabet-display-step3');
const targetDisplay = document.getElementById('target-display');
const targetDisplayStep3 = document.getElementById('target-display-step3');
const featuresDisplay = document.getElementById('features-display');
const featuresDisplayStep3 = document.getElementById('features-display-step3');

// Improved CSV parser function
function parseCSV(csvText) {
  console.log('Parsing CSV...');
  console.log('Raw CSV (first 500 chars):', csvText.substring(0, 500));
  
  const lines = csvText.trim().split('\n');
  console.log('Number of lines:', lines.length);
  console.log('First line (headers):', lines[0]);
  
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or has no data rows');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('Parsed headers:', headers);
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Skip empty lines
    
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    data.push(row);
  }
  
  console.log('Parsed data rows:', data.length);
  console.log('First data row:', data[0]);
  
  return { headers, data };
}

// Load phonemes and features from CSV
window.onload = async () => {
  try {
    console.log('Starting to load CSV...');
    
    // First check if the file exists
    const response = await fetch('ft.csv');
    console.log('Fetch response status:', response.status);
    console.log('Fetch response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`Failed to load ft.csv: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV text length:', csvText.length);
    console.log('CSV starts with:', csvText.substring(0, 100));
    
    if (!csvText || csvText.length < 10) {
      throw new Error('CSV file appears to be empty');
    }
    
    // Parse CSV
    const parsed = parseCSV(csvText);
    csvData = parsed.data;
    
    if (csvData.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Get feature names (exclude 'x' and 'type' columns)
    allFeatures = parsed.headers.filter(h => h !== 'x' && h !== 'type');
    console.log('All features found:', allFeatures);
    
    if (allFeatures.length === 0) {
      throw new Error('No feature columns found in CSV');
    }
    
    // Group phonemes by type
    const groupedPhonemes = {};
    const phonemesWithTypes = [];
    
    csvData.forEach((row, index) => {
      const phoneme = row.x || row.X; // Try both 'x' and 'X'
      const type = row.type || row.Type || 'other'; // Try both cases
      
      if (!phoneme) {
        console.warn(`Row ${index + 1} has no phoneme value:`, row);
        return;
      }
      
      phonemesWithTypes.push({ phoneme, type });
      
      if (!groupedPhonemes[type]) {
        groupedPhonemes[type] = [];
      }
      groupedPhonemes[type].push(phoneme);
    });
    
    console.log('Grouped phonemes:', groupedPhonemes);
    console.log('Total phonemes:', phonemesWithTypes.length);
    
    if (phonemesWithTypes.length === 0) {
      throw new Error('No phonemes found in CSV data');
    }
    
    window.groupedPhonemes = groupedPhonemes;
    allPhonemes = phonemesWithTypes.map(item => item.phoneme);
    
    renderGroupedPhonemeButtons(alphabetDiv, groupedPhonemes, selectedAlphabet);
    updateDisplays();
    
    console.log('App initialization complete!');
    
  } catch (error) {
    console.error('Error loading data:', error);
    
    // Show error message to user
    if (alphabetDiv) {
      alphabetDiv.innerHTML = `
        <div style="color: red; padding: 20px; border: 1px solid red; border-radius: 5px;">
          <h3>Error Loading Data</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Troubleshooting:</strong></p>
          <ul>
            <li>Make sure 'ft.csv' is in the same folder as index.html</li>
            <li>Check browser console (F12) for more details</li>
            <li>Verify the CSV file is not empty</li>
            <li>Make sure the CSV has headers in the first row</li>
          </ul>
        </div>
      `;
    }
  }
};

// Theme toggle functionality
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  
  // Check for saved theme preference
  let currentTheme = localStorage.getItem('theme');
  
  if (!currentTheme) {
    // If no saved preference, detect system preference but don't add classes
    // The CSS media query will handle the styling automatically
    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    // Don't apply theme yet - let system preference handle it naturally
  } else {
    // If there's a saved preference, apply it immediately
    applyTheme(currentTheme);
  }
  
  // Toggle between light and dark
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
  });
  
  function applyTheme(theme) {
    // Remove both classes first
    body.classList.remove('dark-mode', 'light-mode');
    
    if (theme === 'dark') {
      body.classList.add('dark-mode');
    } else {
      body.classList.add('light-mode');
    }
  }
}

document.addEventListener('DOMContentLoaded', initThemeToggle);

function updateDisplays() {
  // Update alphabet displays
  const alphabetText = selectedAlphabet.length > 0 ? selectedAlphabet.join(', ') : '--';
  if (alphabetDisplay) alphabetDisplay.textContent = alphabetText;
  if (alphabetDisplayStep2) alphabetDisplayStep2.textContent = alphabetText;
  if (alphabetDisplayStepFeatures) alphabetDisplayStepFeatures.textContent = alphabetText;
  if (alphabetDisplayStep3) alphabetDisplayStep3.textContent = alphabetText;
  
  // Update target displays
  const targetText = selectedTargets.length > 0 ? selectedTargets.join(', ') : '--';
  if (targetDisplay) targetDisplay.textContent = targetText;
  if (targetDisplayStep3) targetDisplayStep3.textContent = targetText;
  
  // Update features displays
  const featuresText = getSelectedFeaturesText();
  if (featuresDisplay) featuresDisplay.textContent = featuresText;
  if (featuresDisplayStep3) featuresDisplayStep3.textContent = featuresText;
}

function getSelectedFeaturesText() {
  const selected = Object.entries(selectedFeatures)
    .filter(([feature, value]) => value !== null)
    .map(([feature, value]) => `[${feature} ${value}]`);
  return selected.length > 0 ? selected.join(', ') : '--';
}

// Client-side function to find phonemes matching features
function findPhonemesByFeatures(alphabet, featureSpecs) {
  return alphabet.filter(phoneme => {
    const row = csvData.find(r => r.x === phoneme || r.X === phoneme);
    if (!row) return false;
    
    return featureSpecs.every(([feature, value]) => {
      const featureValue = row[feature];
      if (value === '+') return featureValue === '1';
      if (value === '-') return featureValue === '0';
      return false;
    });
  });
}

async function updateMatchingPhonemes() {
  if (selectedAlphabet.length === 0) {
    matchingPhonemes = [];
    return;
  }
  
  const featureSpecs = Object.entries(selectedFeatures)
    .filter(([feature, value]) => value !== null)
    .map(([feature, value]) => [feature, value]);
  
  if (featureSpecs.length === 0) {
    matchingPhonemes = [];
    return;
  }
  
  try {
    matchingPhonemes = findPhonemesByFeatures(selectedAlphabet, featureSpecs);
  } catch (error) {
    console.error('Error finding matching phonemes:', error);
    matchingPhonemes = [];
  }
}

// Client-side analysis function - converted from Python backend
function analyzeMinimumFeatures(alphabet, targets) {
  console.log('Starting analysis for alphabet:', alphabet, 'targets:', targets);
  
  // Check if all phonemes exist in the dataset
  const missingPhonemes = [...alphabet, ...targets].filter(p => 
    !csvData.find(row => row.x === p)
  );
  
  if (missingPhonemes.length > 0) {
    throw new Error(`Phonemes not found in dataset: ${missingPhonemes.join(', ')}`);
  }
  
  // Get non-target phonemes
  const nonTargets = alphabet.filter(p => !targets.includes(p));
  
  // Find features that can potentially describe the target group
  const validFeatures = [];
  
  for (const feature of allFeatures) {
    // Get target values for this feature
    const targetValues = targets.map(phoneme => {
      const row = csvData.find(r => r.x === phoneme);
      return parseInt(row[feature]);
    });
    
    // Skip if any target phoneme has -1 for this feature
    if (targetValues.includes(-1)) continue;
    
    // Check if all target phonemes have the same value for this feature
    const uniqueValues = [...new Set(targetValues)];
    if (uniqueValues.length === 1) {
      const targetValue = uniqueValues[0];
      
      // Check if this feature value distinguishes targets from non-targets
      if (nonTargets.length > 0) {
        const nonTargetValues = nonTargets.map(phoneme => {
          const row = csvData.find(r => r.x === phoneme);
          return parseInt(row[feature]);
        });
        
        // Feature is valid if not all non-targets have the same value as targets
        if (!nonTargetValues.every(val => val === targetValue)) {
          validFeatures.push(feature);
        }
      } else {
        // If no non-targets, any consistent feature is valid
        validFeatures.push(feature);
      }
    }
  }
  
  console.log('Valid features found:', validFeatures);
  
  // Helper function to check if a combination of features is sufficient
  function isSufficientCombination(featureCombo) {
    // Get signatures for target phonemes
    const targetSignatures = new Set();
    
    for (const phoneme of targets) {
      const row = csvData.find(r => r.x === phoneme);
      const signature = featureCombo.map(feature => parseInt(row[feature])).join(',');
      targetSignatures.add(signature);
    }
    
    // Check if any non-target phoneme has the same signature
    for (const phoneme of nonTargets) {
      const row = csvData.find(r => r.x === phoneme);
      const signature = featureCombo.map(feature => parseInt(row[feature])).join(',');
      if (targetSignatures.has(signature)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Helper function to generate combinations
  function* combinations(array, size) {
    if (size === 0) {
      yield [];
      return;
    }
    
    for (let i = 0; i <= array.length - size; i++) {
      for (const combo of combinations(array.slice(i + 1), size - 1)) {
        yield [array[i], ...combo];
      }
    }
  }
  
  // Try combinations of increasing size until we find sufficient ones
  for (let size = 1; size <= validFeatures.length; size++) {
    const solutions = [];
    
    for (const combo of combinations(validFeatures, size)) {
      if (isSufficientCombination(combo)) {
        // Create feature-value pairs for this solution
        const solution = [];
        for (const feature of combo) {
          // Get the shared value for this feature among target phonemes
          const targetRow = csvData.find(r => r.x === targets[0]);
          const sharedValue = parseInt(targetRow[feature]);
          const valueSymbol = sharedValue === 1 ? '+' : '-';
          solution.push([feature, valueSymbol]);
        }
        solutions.push(solution);
      }
    }
    
    // If we found solutions at this size, return all of them (they're minimal)
    if (solutions.length > 0) {
      console.log('Found solutions:', solutions);
      
      if (solutions.length === 1) {
        return {
          solutions: solutions,
          message: `Unique minimal solution found with ${size} feature(s)`
        };
      } else {
        return {
          solutions: solutions,
          message: `Multiple minimal solutions found with ${size} feature(s) each`
        };
      }
    }
  }
  
  // If no combination works, return null (no solution)
  console.log('No solution found');
  return null;
}

async function updateLiveResults() {
  if (!liveResultsDiv) return;
  
  if (selectedTargets.length === 0) {
    liveResultsDiv.innerHTML = '<div class="no-solution-message">Select target phonemes to see solutions</div>';
    return;
  }
  
  if (selectedTargets.length === selectedAlphabet.length) {
    liveResultsDiv.innerHTML = '<div class="no-solution-message">Cannot select all phonemes as targets</div>';
    return;
  }
  
  try {
    const data = analyzeMinimumFeatures(selectedAlphabet, selectedTargets);
    liveResultsDiv.innerHTML = formatLiveResults(data);
  } catch (error) {
    liveResultsDiv.innerHTML = '<div class="no-solution-message">Error computing solutions</div>';
  }
}

function formatLiveResults(data) {
  if (!data || !data.solutions || data.solutions.length === 0) {
    return '<div class="no-solution-message">No solution found for this combination</div>';
  }
  
  let html = '';
  
  data.solutions.forEach((solution, index) => {
    html += `
      <div class="live-result-item">
        <h4>${data.solutions.length > 1 ? `Solution ${index + 1}` : 'Solution'}</h4>
        <div class="live-features">
    `;
    
    solution.forEach(([feature, value]) => {
      html += `<span class="live-feature-item">[${feature} ${value}]</span>`;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  return html;
}

function formatResults(data) {
  if (!data) {
    return `
      <div class="result-section no-solution">
        <h3>No Solution Found</h3>
        <p>No combination of features can uniquely identify the target phonemes within the given alphabet.</p>
      </div>
    `;
  }

  if (!data.solutions || data.solutions.length === 0) {
    return `
      <div class="result-section no-solution">
        <h3>No Solution Found</h3>
        <p>No combination of features can uniquely identify the target phonemes within the given alphabet.</p>
      </div>
    `;
  }

  let html = `<div class="result-section success">`;
  
  if (data.solutions.length === 1) {
    html += `<h3>Unique Solution Found</h3>`;
  } else {
    html += `<h3>${data.solutions.length} Possible Solutions Found</h3>`;
  }

  if (data.message) {
    html += `<p class="result-message">${data.message}</p>`;
  }

  // Create horizontal scrollable container
  html += `<div class="solutions-carousel">`;

  data.solutions.forEach((solution, index) => {
    html += `
      <div class="solution-card">
        <div class="solution-header">
          <h4>Solution ${data.solutions.length > 1 ? index + 1 : ''}</h4>
        </div>
        <div class="solution-features">
    `;
    
    solution.forEach(([feature, value]) => {
      html += `<div class="feature-item">[${feature} ${value}]</div>`;
    });
    
    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`; // Close carousel
  html += `</div>`; // Close result-section
  return html;
}

function renderPhonemeButtons(container, phonemes, selection, highlightMatching = false) {
  container.innerHTML = '';
  phonemes.forEach(p => {
    const btn = document.createElement('button');
    btn.textContent = p;
    btn.className = 'phoneme-btn';
    
    if (selection.includes(p)) btn.classList.add('selected');
    if (highlightMatching && matchingPhonemes.includes(p)) btn.classList.add('matching');
    
    btn.onclick = () => {
      if (selection.includes(p)) {
        selection.splice(selection.indexOf(p), 1);
        btn.classList.remove('selected');
      } else {
        selection.push(p);
        btn.classList.add('selected');
      }
      updateDisplays();
      
      // Update live results if we're in step 2
      if (selection === selectedTargets) {
        updateLiveResults();
      }
    };
    container.appendChild(btn);
  });
}

function renderGroupedPhonemeButtons(container, groupedPhonemes, selection) {
  container.innerHTML = '';
  
  // Define the order you want
  const typeOrder = ['consonants', 'vowels (simple)', 'vowels (advanced)', 'complex segments', 'contour segments'];
  
  // Use the defined order, fallback to alphabetical for any missing types
  const orderedTypes = typeOrder.filter(type => groupedPhonemes[type]);
  const remainingTypes = Object.keys(groupedPhonemes)
    .filter(type => !typeOrder.includes(type))
    .sort();
  
  [...orderedTypes, ...remainingTypes].forEach(type => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'phoneme-section';
    
    const typeHeader = document.createElement('div');
    typeHeader.className = 'phoneme-type-header';
    typeHeader.textContent = type;
    sectionDiv.appendChild(typeHeader);
    
    const typeGrid = document.createElement('div');
    typeGrid.className = 'phoneme-type-grid';
    
    groupedPhonemes[type].forEach(phoneme => {
      const btn = document.createElement('button');
      btn.textContent = phoneme;
      btn.className = 'phoneme-btn';
      
      if (selection.includes(phoneme)) btn.classList.add('selected');
      
      btn.onclick = () => {
        if (selection.includes(phoneme)) {
          selection.splice(selection.indexOf(phoneme), 1);
          btn.classList.remove('selected');
        } else {
          selection.push(phoneme);
          btn.classList.add('selected');
        }
        updateDisplays();
      };
      
      typeGrid.appendChild(btn);
    });
    
    sectionDiv.appendChild(typeGrid);
    container.appendChild(sectionDiv);
  });
}

function renderFeatureButtons(container) {
  container.innerHTML = '';
  allFeatures.forEach(feature => {
    const featureDiv = document.createElement('div');
    featureDiv.className = 'feature-control';
    
    const featureBtn = document.createElement('button');
    featureBtn.textContent = feature;
    featureBtn.className = 'feature-btn';
    
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'feature-toggle';
    
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    plusBtn.className = 'toggle-btn';
    plusBtn.disabled = true;
    
    const minusBtn = document.createElement('button');
    minusBtn.textContent = '-';
    minusBtn.className = 'toggle-btn';
    minusBtn.disabled = true;
    
    // Feature button click - enables/disables toggles
    featureBtn.onclick = () => {
      if (selectedFeatures[feature] === undefined) {
        selectedFeatures[feature] = null; // Feature is now "active" but no value set
        featureBtn.classList.add('active');
        plusBtn.disabled = false;
        minusBtn.disabled = false;
      } else {
        delete selectedFeatures[feature];
        featureBtn.classList.remove('active');
        plusBtn.disabled = true;
        minusBtn.disabled = true;
        plusBtn.classList.remove('selected');
        minusBtn.classList.remove('selected');
        updateMatchingPhonemes().then(() => {
          updateAlphabetFeaturesDisplay();
          updateDisplays();
        });
      }
    };
    
    // Plus button click
    plusBtn.onclick = () => {
      selectedFeatures[feature] = '+';
      plusBtn.classList.add('selected');
      minusBtn.classList.remove('selected');
      updateMatchingPhonemes().then(() => {
        updateAlphabetFeaturesDisplay();
        updateDisplays();
      });
    };
    
    // Minus button click
    minusBtn.onclick = () => {
      selectedFeatures[feature] = '-';
      minusBtn.classList.add('selected');
      plusBtn.classList.remove('selected');
      updateMatchingPhonemes().then(() => {
        updateAlphabetFeaturesDisplay();
        updateDisplays();
      });
    };
    
    toggleDiv.appendChild(plusBtn);
    toggleDiv.appendChild(minusBtn);
    featureDiv.appendChild(featureBtn);
    featureDiv.appendChild(toggleDiv);
    container.appendChild(featureDiv);
  });
}

function updateAlphabetFeaturesDisplay() {
  const alphabetFeaturesDiv = document.getElementById('alphabet-buttons-features');
  const alphabetContainer = document.createElement('div');
  alphabetContainer.className = 'phoneme-type-grid';
  alphabetFeaturesDiv.innerHTML = '';
  alphabetFeaturesDiv.appendChild(alphabetContainer);
  
  selectedAlphabet.forEach(phoneme => {
    const btn = document.createElement('button');
    btn.textContent = phoneme;
    btn.className = 'phoneme-btn';
    if (matchingPhonemes.includes(phoneme)) btn.classList.add('matching');
    alphabetContainer.appendChild(btn);
  });
}

function goToStep1() {
  step1.classList.remove('hidden');
  step2.classList.add('hidden');
  step3.classList.add('hidden');
  stepFeatures.classList.add('hidden');
  
  if (window.groupedPhonemes) {
    renderGroupedPhonemeButtons(alphabetDiv, window.groupedPhonemes, selectedAlphabet);
  } else {
    renderPhonemeButtons(alphabetDiv, allPhonemes, selectedAlphabet);
  }
  
  updateDisplays();
}

function goToStep2() {
  if (selectedAlphabet.length === 0) return alert('Select at least one phoneme.');
  step1.classList.add('hidden');
  step2.classList.remove('hidden');
  step3.classList.add('hidden');
  stepFeatures.classList.add('hidden');
  selectedTargets = [];
  
  // Use horizontal layout for target phonemes with left alignment
  const targetContainer = document.createElement('div');
  targetContainer.className = 'phoneme-type-grid target-phonemes-grid';
  targetDiv.innerHTML = '';
  targetDiv.appendChild(targetContainer);
  
  selectedAlphabet.forEach(phoneme => {
    const btn = document.createElement('button');
    btn.textContent = phoneme;
    btn.className = 'phoneme-btn';
    
    btn.onclick = () => {
      if (selectedTargets.includes(phoneme)) {
        selectedTargets.splice(selectedTargets.indexOf(phoneme), 1);
        btn.classList.remove('selected');
      } else {
        selectedTargets.push(phoneme);
        btn.classList.add('selected');
      }
      updateDisplays();
      updateLiveResults();
    };
    
    targetContainer.appendChild(btn);
  });
  
  updateLiveResults(); // Initialize with empty message
  updateDisplays();
}

function goToStepFeatures() {
  if (selectedAlphabet.length === 0) return alert('Select at least one phoneme.');
  step1.classList.add('hidden');
  step2.classList.add('hidden');
  step3.classList.add('hidden');
  stepFeatures.classList.remove('hidden');
  selectedFeatures = {};
  matchingPhonemes = [];
  renderFeatureButtons(featuresDiv);
  
  updateAlphabetFeaturesDisplay();
  updateDisplays();
}

function closeApp() {
  if (confirm('Are you sure you want to close the app? All selections will be lost.')) {
    // Reset everything
    selectedAlphabet = [];
    selectedTargets = [];
    selectedFeatures = {};
    matchingPhonemes = [];
    
    // Hide all steps
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    stepFeatures.classList.add('hidden');
    
    // Show a simple closed message or reload
    document.body.innerHTML = `
      <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
        <h1>Phoneme-Feature Analysis</h1>
        <p>Application closed. <a href="javascript:location.reload()">Click here to restart</a>.</p>
      </div>
    `;
  }
}

function analyze() {
  if (selectedTargets.length === 0) return alert('Select target phonemes.');
  
  try {
    const data = analyzeMinimumFeatures(selectedAlphabet, selectedTargets);
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.remove('hidden');
    resultDiv.innerHTML = formatResults(data);
    updateDisplays();
  } catch (error) {
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.remove('hidden');
    resultDiv.innerHTML = `
      <div class="result-section error">
        <h3>Error</h3>
        <p>An error occurred while analyzing: ${error.message}</p>
      </div>
    `;
    updateDisplays();
  }
}

function reset() {
  selectedAlphabet = [];
  selectedTargets = [];
  selectedFeatures = {};
  matchingPhonemes = [];
  goToStep1();
}