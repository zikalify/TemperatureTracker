// DOM Elements
const tempForm = document.getElementById('tempForm');
const entriesList = document.getElementById('entriesList');
const ovulationInfo = document.getElementById('ovulationInfo');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

// Temperature conversion functions
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

// Get current temperature unit (C or F)
function getCurrentUnit() {
    return celsiusBtn.classList.contains('active') ? 'C' : 'F';
}

// Format temperature based on current unit
function formatTemperature(temp, withUnit = true) {
    const isCelsius = getCurrentUnit() === 'C';
    let displayTemp = parseFloat(temp);
    
    if (!isCelsius) {
        displayTemp = celsiusToFahrenheit(displayTemp);
    }
    
    // Round to 1 decimal place
    displayTemp = Math.round(displayTemp * 10) / 10;
    
    return withUnit ? `${displayTemp}°${isCelsius ? 'C' : 'F'}` : displayTemp;
}

// Convert input temperature to Celsius for storage
function getTempForStorage(temp) {
    const isCelsius = getCurrentUnit() === 'C';
    return isCelsius ? parseFloat(temp) : fahrenheitToCelsius(parseFloat(temp));
}

// Update temperature display in the form
function updateTempInputs() {
    const tempInput = document.getElementById('temperature');
    const editTempInput = document.getElementById('editTemperature');
    
    // Update placeholders and labels
    const unit = getCurrentUnit();
    document.querySelector('label[for="temperature"]').textContent = `Temperature (°${unit})`;
    document.querySelector('label[for="editTemperature"]').textContent = `Temperature (°${unit})`;
    
    // Convert current values if they exist
    if (tempInput.value) {
        tempInput.value = formatTemperature(tempInput.value, false);
    }
    
    if (editTempInput.value) {
        editTempInput.value = formatTemperature(editTempInput.value, false);
    }
}

// Set default date to today and format it
document.addEventListener('DOMContentLoaded', () => {
    // Load saved unit preference
    const savedUnit = localStorage.getItem('temperatureUnit') || 'C';
    if (savedUnit === 'F') {
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
    } else {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    }
    
    // Update temperature display based on saved preference
    updateTempInputs();
    
    // Add event listeners for unit toggle buttons
    celsiusBtn.addEventListener('click', () => {
        if (!celsiusBtn.classList.contains('active')) {
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
            localStorage.setItem('temperatureUnit', 'C');
            updateTempInputs();
            loadEntries();
        }
    });
    
    fahrenheitBtn.addEventListener('click', () => {
        if (!fahrenheitBtn.classList.contains('active')) {
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            localStorage.setItem('temperatureUnit', 'F');
            updateTempInputs();
            loadEntries();
        }
    });
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (dateInput && dateDisplay) {
        dateInput.value = formattedDate;
        // Format the initial display
        updateDateDisplay(dateInput, dateDisplay);
        
        // Add event listener for date changes
        dateInput.addEventListener('change', (e) => {
            updateDateDisplay(e.target, dateDisplay);
        });
    }
    
    loadEntries();
    
    // Add event listener for expand/collapse button if it exists
    const toggleButton = document.getElementById('toggleEntries');
    const entriesList = document.querySelector('.entries-list');
    
    if (toggleButton && entriesList) {
        // Set initial state
        entriesList.classList.add('collapsed');
        
        toggleButton.addEventListener('click', () => {
            const isExpanding = entriesList.classList.contains('collapsed');
            
            // Toggle the classes
            entriesList.classList.toggle('collapsed');
            entriesList.classList.toggle('expanded');
            
            // Update the button icon and text
            const icon = toggleButton.querySelector('i');
            
            if (icon) {
                if (isExpanding) {
                    icon.className = 'fas fa-chevron-up';
                    toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i> Show Less';
                } else {
                    icon.className = 'fas fa-chevron-down';
                    toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i> Show All';
                }
            }
        });
    }
});

// Event Listeners
tempForm.addEventListener('submit', handleFormSubmit);

document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const temperature = getTempForStorage(document.getElementById('temperature').value);
    const notes = document.getElementById('notes').value;
    
    const entry = {
        id: Date.now().toString(),
        date,
        temperature,
        notes
    };
    
    saveEntry(entry);
    tempForm.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
}

// Save entry to local storage
function saveEntry(entry) {
    const entries = getEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex >= 0) {
        entries[existingIndex] = entry;
    } else {
        entries.push(entry);
    }
    
    localStorage.setItem('temperatureEntries', JSON.stringify(entries));
    loadEntries();
}

// Get all entries from local storage
function getEntries() {
    const entries = localStorage.getItem('temperatureEntries');
    return entries ? JSON.parse(entries) : [];
}

// Get entries for ovulation calculation (no date filtering, just return all entries)
function getRecentEntriesForOvulation(entries) {
    return [...entries]; // Return a copy of all entries
}

// Load and display entries
function loadEntries() {
    const entries = getEntries();
    entriesList.innerHTML = '';
    
    if (entries.length === 0) {
        entriesList.innerHTML = '<p>No entries yet. Add your first temperature reading above.</p>';
        updateOvulationInfo([]);
        return;
    }
    
    // Get recent entries for ovulation calculation
    const recentEntriesForOvulation = getRecentEntriesForOvulation(entries);
    
    // Sort all entries by date (newest first) for display
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display all entries
    sortedEntries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry-card';
        entryElement.innerHTML = `
            <div class="entry-date">${formatDate(entry.date)}</div>
            <div class="entry-temp">${formatTemperature(entry.temperature)}</div>
            ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
            <div class="entry-actions">
                <button onclick="editEntry('${entry.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteEntry('${entry.id}')" class="danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        entriesList.appendChild(entryElement);
    });
    
    // Update ovulation info using only recent entries
    updateOvulationInfo(recentEntriesForOvulation);
}

// Calculate most likely ovulation date based on temperature data using strict 3-over-6 rule
function calculateOvulationDate(entries) {
    if (!entries || entries.length < 9) { // Need at least 9 days (6 for average + 3 for rise)
        return null;
    }

    // Sort entries by date (oldest first)
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    let mostRecentOvulationDay = null;
    
    // Start from the 9th day to have enough history (6 days) + 3 days for the rise
    for (let i = 8; i < sortedEntries.length; i++) {
        // Check if we have consecutive days
        // This checks the 9-day window: 3 rise days (i, i-1, i-2) and 6 baseline days (i-3 to i-8)
        let hasConsecutiveDays = true;
        for (let j = 0; j < 8; j++) {
            const currentDate = new Date(sortedEntries[i - j].date);
            // Since i >= 8 and j <= 7, i-j-1 >= 0, so sortedEntries[i-j-1] is always a valid access.
            const prevDate = new Date(sortedEntries[i - j - 1].date);
            const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
            
            // Allow for slight variations around a 1-day difference (e.g., DST changes)
            // but consider a difference greater than 1.1 days (approx 26.4 hours) as a gap.
            // A 2-day gap would be dayDiff = 2.
            if (dayDiff > 1.1 || dayDiff < 0.9 && dayDiff !== 0) { // Also check for non-zero small fractions if dates are not perfectly midnight
                hasConsecutiveDays = false;
                break;
            }
        }
        
        if (!hasConsecutiveDays) continue;
        
        // Get the 6 temperatures for the baseline.
        // The 3-day rise consists of: sortedEntries[i-2] (H1), sortedEntries[i-1] (H2), sortedEntries[i] (H3).
        // The 6 baseline temperatures are those immediately preceding H1:
        // sortedEntries[i-3], sortedEntries[i-4], ..., sortedEntries[i-8].
        const previousSixTemps = [];
        for (let k = 0; k < 6; k++) {
            // Accesses sortedEntries[i-3] down to sortedEntries[i-8]
            previousSixTemps.push(parseFloat(sortedEntries[i - 3 - k].temperature));
        }
        
        // Calculate average of previous 6 days
        const avgPrevSix = previousSixTemps.reduce((sum, temp) => sum + temp, 0) / 6;

        // Check next 3 days are all at least 0.2°C above the 6-day average
        let isOvulationPattern = true;
        for (let j = 0; j < 3; j++) {
            const currentTemp = parseFloat(sortedEntries[i - j].temperature);
            if (currentTemp <= avgPrevSix + 0.2) {
                isOvulationPattern = false;
                break;
            }
        }
        
        if (isOvulationPattern) {
            // The ovulation day is the day before the 3-day rise starts
            const ovulationDate = new Date(sortedEntries[i - 3].date);
            
            // Only update if this is the most recent ovulation found
            if (!mostRecentOvulationDay || ovulationDate > mostRecentOvulationDay) {
                mostRecentOvulationDay = ovulationDate;
            }
        }
    }
    
    return mostRecentOvulationDay;
}

// Update ovulation information display
function updateOvulationInfo(entries) {
    const minDaysRequired = 9; // Consistent with calculateOvulationDate

    if (!entries || entries.length === 0) {
        ovulationInfo.innerHTML = `<p>Add at least ${minDaysRequired} days of temperature data to estimate your ovulation date.</p>`;
        return;
    }
    
    const result = calculateOvulationDate(entries);
    
    if (result) {
        let message = `<p><strong>Most likely previous ovulation:</strong> ${formatDate(result.toISOString().split('T')[0])}</p>`;
        
        message += '<p class="info-note">Based on your temperature data. Ovulation typically occurs 1-2 days before a sustained temperature rise.</p>';
        
        ovulationInfo.innerHTML = message;
    } else {
        // No ovulation pattern detected or not enough data
        if (entries.length < minDaysRequired) {
            const daysNeeded = minDaysRequired - entries.length;
            ovulationInfo.innerHTML = `
                <p>Not enough data to estimate ovulation. Add ${daysNeeded} more day${daysNeeded > 1 ? 's' : ''} of temperature data.</p><p class="info-note">At least ${minDaysRequired} consecutive days of readings are needed for this calculation.</p>
            `;
        } else {
            // Sufficient data (>= minDaysRequired) but no pattern found
            ovulationInfo.innerHTML = `
                <p>No clear ovulation pattern detected in your temperature data.</p>
                <p class="info-note">Keep tracking your temperature daily. The algorithm looks for a sustained temperature rise of over 0.2°C for 3 days, compared to the average of the 6 preceding days.</p>
            `;
        }
    }
}

// Helper function to update date display
function updateDateDisplay(inputElement, displayElement) {
    if (!inputElement || !displayElement) return;
    
    const date = new Date(inputElement.value);
    if (isNaN(date.getTime())) return;
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    displayElement.textContent = date.toLocaleDateString('en-US', options);
}

// Edit entry
function editEntry(id) {
    const entries = getEntries();
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        document.getElementById('editId').value = entry.id;
        document.getElementById('editDate').value = entry.date;
        document.getElementById('editTemperature').value = formatTemperature(entry.temperature, false);
        document.getElementById('editNotes').value = entry.notes || '';
        document.getElementById('editModal').style.display = 'block';
    }
}

// Handle edit form submission
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const date = document.getElementById('editDate').value;
    const temperature = getTempForStorage(document.getElementById('editTemperature').value);
    const notes = document.getElementById('editNotes').value;
    
    const entries = getEntries();
    const index = entries.findIndex(e => e.id === id);
    
    if (index !== -1) {
        entries[index] = { ...entries[index], date, temperature, notes };
        localStorage.setItem('temperatureEntries', JSON.stringify(entries));
        loadEntries();
        document.getElementById('editModal').style.display = 'none';
    }
});

// Delete entry
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        const entries = getEntries().filter(entry => entry.id !== id);
        localStorage.setItem('temperatureEntries', JSON.stringify(entries));
        loadEntries();
    }
}

// Helper function to format date as "DD MMM YYYY"
function formatDate(dateString) {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}