let allPhonemes = [];
let allFeatures = [];
let selectedAlphabet = [];
let selectedTargets = [];
let selectedFeatures = {}; // {featureName: '+' or '-' or null}
let matchingPhonemes = []; // Phonemes that match selected features

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

// Load phonemes and features from backend
window.onload = async () => {
  try {
    const phonemesWithTypesRes = await fetch('http://127.0.0.1:5000/phonemes-with-types');
    const phonemesWithTypes = await phonemesWithTypesRes.json();
    
    const groupedPhonemes = {};
    phonemesWithTypes.forEach(item => {
      const type = item.type || 'other';
      if (!groupedPhonemes[type]) {
        groupedPhonemes[type] = [];
      }
      groupedPhonemes[type].push(item.phoneme);
    });
    
    window.groupedPhonemes = groupedPhonemes;
    allPhonemes = phonemesWithTypes.map(item => item.phoneme);
    
    const featuresRes = await fetch('http://127.0.0.1:5000/features');
    allFeatures = await featuresRes.json();
    
    renderGroupedPhonemeButtons(alphabetDiv, groupedPhonemes, selectedAlphabet);
    updateDisplays();
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

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
    const response = await fetch('http://127.0.0.1:5000/find-by-features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alphabet: selectedAlphabet,
        features: featureSpecs
      })
    });
    
    const data = await response.json();
    matchingPhonemes = data.matching_phonemes || [];
  } catch (error) {
    console.error('Error finding matching phonemes:', error);
    matchingPhonemes = [];
  }
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
    const response = await fetch('http://127.0.0.1:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alphabet: selectedAlphabet,
        targets: selectedTargets
      })
    });
    
    const data = await response.json();
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
        
        updateDisplays();
      });
    };
    
    // Minus button click
    minusBtn.onclick = () => {
      selectedFeatures[feature] = '-';
      minusBtn.classList.add('selected');
      plusBtn.classList.remove('selected');
      updateMatchingPhonemes().then(() => {
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
  
  // Render alphabet buttons in horizontal layout for features step
  const alphabetFeaturesDiv = document.getElementById('alphabet-buttons-features');
  const alphabetContainer = document.createElement('div');
  alphabetContainer.className = 'phoneme-type-grid';
  alphabetFeaturesDiv.innerHTML = '';
  alphabetFeaturesDiv.appendChild(alphabetContainer);
  
  selectedAlphabet.forEach(phoneme => {
    const btn = document.createElement('button');
    btn.textContent = phoneme;
    btn.className = 'phoneme-btn';
    
    // Check if this phoneme matches current features
    if (matchingPhonemes.includes(phoneme)) btn.classList.add('matching');
    
    // No selection functionality for alphabet display in features step
    alphabetContainer.appendChild(btn);
  });
  
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
  fetch('http://127.0.0.1:5000/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alphabet: selectedAlphabet,
      targets: selectedTargets
    })
  })
    .then(res => res.json())
    .then(data => {
      step1.classList.add('hidden');
      step2.classList.add('hidden');
      step3.classList.remove('hidden');
      resultDiv.innerHTML = formatResults(data);
      updateDisplays();
    })
    .catch(error => {
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
    });
}

function reset() {
  selectedAlphabet = [];
  selectedTargets = [];
  selectedFeatures = {};
  matchingPhonemes = [];
  goToStep1();
}