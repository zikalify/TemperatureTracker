// Make handleEditClick globally available
window.handleEditClick = function(event, id) {
    event.stopPropagation();
    event.preventDefault();
    const entries = getEntries();
    const entry = entries.find(e => e.id === id);
    if (entry) {
        // Check if showEditModal is available
        if (typeof window.showEditModal === 'function') {
            window.showEditModal(entry);
        } else {
            console.error('showEditModal function not found');
            // Try to initialize the modal if it's not available
            initializeModal();
            if (typeof window.showEditModal === 'function') {
                window.showEditModal(entry);
            } else {
                alert('Error: Could not initialize edit form');
            }
        }
    } else {
        console.error('Entry not found:', id);
        alert('Error: Entry not found');
    }
};

// Initialize modal and related functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Make showEditModal globally available
    window.showEditModal = function(entry) {
        const editId = document.getElementById('editId');
        const editDate = document.getElementById('editDate');
        const editTemperature = document.getElementById('editTemperature');
        const editNotes = document.getElementById('editNotes');
        
        if (!editId || !editDate || !editTemperature || !editNotes) {
            console.error('Required form elements not found');
            // Try to initialize the modal again
            initializeModal();
            // Try to get the elements again
            const editId = document.getElementById('editId');
            const editDate = document.getElementById('editDate');
            const editTemperature = document.getElementById('editTemperature');
            const editNotes = document.getElementById('editNotes');
            
            if (!editId || !editDate || !editTemperature || !editNotes) {
                console.error('Still could not find required form elements');
                return;
            }
        }
        
        // Set form values
        editId.value = entry.id;
        editDate.value = entry.date;
        
        // Display temperature in the current unit
        const currentUnit = getCurrentUnit();
        const displayTemp = currentUnit === 'C' ? entry.temperature : celsiusToFahrenheit(entry.temperature);
        editTemperature.value = displayTemp.toFixed(1);
        
        editNotes.value = entry.notes || '';
        
        // Show the modal
        showModal();
    };
    
    // Initialize modal
    function initializeModal() {
        // Make sure modal elements exist
        const modal = document.getElementById('editModal');
        if (!modal) {
            console.error('Edit modal not found in the DOM');
            return false;
        }
        return true;
    }
    
    // Initialize the modal when the page loads
    initializeModal();
});

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
    
    if (editTempInput && editTempInput.value) {
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
    // Format the date in YYYY-MM-DD format using local time
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateInput = document.getElementById('date');
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (dateInput && dateDisplay) {
        // Set the max attribute to today's date to prevent future date selection
        dateInput.max = formattedDate;
        dateInput.value = formattedDate;
        // Format the initial display
        updateDateDisplay(dateInput, dateDisplay);
        
        // Add event listener for date changes
        dateInput.addEventListener('change', (e) => {
            // If somehow a future date is still selected (e.g., via manual input), reset to today
            const selectedDate = new Date(e.target.value);
            if (selectedDate > today) {
                e.target.value = formattedDate;
            }
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

// Modal handling
const editModal = document.getElementById('editModal');
const modalClose = document.querySelector('.modal-close');
const cancelEdit = document.getElementById('cancelEdit');

// Show modal with animation
function showModal() {
    editModal.style.display = 'flex';
    // Trigger reflow to enable animation
    void editModal.offsetWidth;
    editModal.classList.add('active');
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

// Hide modal with animation
function hideModal() {
    editModal.classList.remove('active');
    // Wait for animation to complete before hiding
    setTimeout(() => {
        editModal.style.display = 'none';
        // Restore body scroll
        document.body.style.overflow = '';
    }, 200);
}

// Close modal when clicking the X button
if (modalClose) {
    modalClose.addEventListener('click', hideModal);
}

// Close modal when clicking cancel button
if (cancelEdit) {
    cancelEdit.addEventListener('click', hideModal);
}

// Close modal when clicking outside the modal content
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        hideModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.style.display === 'flex') {
        hideModal();
    }
});

// Update the edit form submission handler
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const id = document.getElementById('editId').value;
    const dateInput = document.getElementById('editDate').value;
    let tempInput = document.getElementById('editTemperature').value.trim();
    const notes = document.getElementById('editNotes').value;
    
    // Validate temperature input
    if (!tempInput || tempInput === '') {
        alert('Please enter a temperature');
        return false;
    }
    
    // Convert the input temperature to a number and ensure proper conversion
    let temperature = parseFloat(tempInput.replace(',', '.')); // Handle both comma and dot decimal separators
    if (isNaN(temperature)) {
        alert('Please enter a valid temperature');
        return false;
    }
    
    // Validate temperature range before conversion
    const currentUnit = getCurrentUnit();
    if (!isValidTemperature(temperature, currentUnit)) {
        const range = currentUnit === 'C' ? '35°C-42°C' : '95°F-107.6°F';
        alert(`Please enter a valid temperature between ${range}`);
        return false;
    }
    
    // Convert to Celsius if we're in Fahrenheit mode
    if (currentUnit === 'F') {
        temperature = fahrenheitToCelsius(temperature);
    }
    
    // Round to one decimal place for consistency
    temperature = Math.round(temperature * 10) / 10;
    
    // Automatically determine if temperature indicates fever (≥38°C or ≥100.4°F)
    const hasFever = temperature >= 38;
    
    try {
        const entries = getEntries();
        const index = entries.findIndex(e => e.id === id);
        
        if (index !== -1) {
            // Update the entry with new values
            entries[index].date = dateInput;
            entries[index].temperature = temperature;
            entries[index].notes = notes;
            entries[index].fever = hasFever;
            
            // Save the updated entries
            localStorage.setItem('temperatureEntries', JSON.stringify(entries));
            
            // Hide the modal and refresh the entries list
            hideModal();
            loadEntries();
        } else {
            console.error('Entry not found:', id);
            alert('Error: Entry not found');
        }
    } catch (error) {
        console.error('Error updating entry:', error);
        alert('An error occurred while updating the entry');
    }
    
    return false;
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

// Get device's current date in YYYY-MM-DD format
// Uses the device's local timezone
function getCurrentLocalDate() {
    const now = new Date();
    // Use the device's local timezone
    return now.toISOString().split('T')[0];
}

/**
 * Convert date string to local date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date in local timezone
    return new Date(year, month - 1, day);
}

/**
 * Calculate days between two dates (local timezone)
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days between dates
 */
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((date1 - date2) / oneDay));
    return diffDays;
}

/**
 * Validate temperature value is within reasonable range
 * @param {number} temp - Temperature in Celsius
 * @param {string} unit - 'C' or 'F'
 * @returns {boolean} True if temperature is valid
 */
function isValidTemperature(temp, unit) {
    if (isNaN(temp)) return false;
    
    // Convert to Celsius for comparison
    const tempC = unit === 'F' ? (temp - 32) * 5/9 : temp;
    
    // Reasonable range: 35°C to 42°C (95°F to 107.6°F)
    return tempC >= 35 && tempC <= 42;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const dateInput = document.getElementById('date');
    const tempInput = document.getElementById('temperature');
    const notes = document.getElementById('notes').value;
    
    // Validate date is not in the future
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedDate = new Date(dateInput.value);
    const selectedDateLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    if (selectedDateLocal > todayLocal) {
        alert('Cannot add entries for future dates');
        return;
    }
    
    // Validate temperature
    const temp = parseFloat(tempInput.value);
    if (!isValidTemperature(temp, getCurrentUnit())) {
        alert('Please enter a valid temperature between 35°C-42°C (95°F-107.6°F)');
        return;
    }
    
    const temperature = getTempForStorage(temp);
    
    // Automatically determine if temperature indicates fever (≥38°C or ≥100.4°F)
    const hasFever = temperature >= 38;
    
    const entry = {
        id: Date.now().toString(),
        date: dateInput.value,
        temperature,
        notes,
        fever: hasFever,
        // Store the timezone offset in minutes
        timezoneOffset: new Date().getTimezoneOffset()
    };
    
    saveEntry(entry);
    tempForm.reset();
    dateInput.value = getCurrentLocalDate();
}

// Save entry to local storage
function saveEntry(entry) {
    const entries = getEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);

    if (existingIndex >= 0) {
        // Preserve the original id
        entry.id = entries[existingIndex].id;
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
    
    sortedEntries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry-card';
        entryElement.innerHTML = `
            <div class="entry-date">${formatDate(entry.date)}</div>
            <div class="entry-temp">${formatTemperature(entry.temperature)}</div>
            ${entry.fever ? '<div class="fever-flag">Fever/Illness</div>' : ''}
            ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
            <div class="entry-actions">
                <button type="button" onclick="handleEditClick(event, '${entry.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button type="button" onclick="deleteEntry('${entry.id}')" class="danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        entriesList.appendChild(entryElement);
    });
    
    // Update ovulation info using only recent entries
    updateOvulationInfo(entries);
}

// Helper function to get entries within a date range, excluding fever readings
function getEntriesInRange(entries, startDate, endDate) {
    return entries
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return !entry.fever && 
                   entryDate >= startDate && 
                   entryDate <= endDate;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Calculate most likely ovulation date based on temperature data using flexible 3-over-6 rule
function calculateOvulationDate(entries) {
    if (!entries || entries.length < 6) {
        return { date: null, confidence: 'low', message: 'Insufficient data' };
    }

    const sortedEntries = [...entries]
        .filter(entry => !entry.fever)
        .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    
    const today = new Date();
    const lookbackDays = 30; // Increased from 21 to 30 days for more flexibility
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - lookbackDays);
    
    // Get valid entries within date range
    const validEntries = sortedEntries.filter(entry => {
        const entryDate = parseLocalDate(entry.date);
        return entryDate >= startDate && entryDate <= today;
    });
    
    if (validEntries.length < 6) {
        return { 
            date: null, 
            confidence: 'low', 
            message: `Need at least 6 valid readings (have ${validEntries.length})` 
        };
    }
    
    let bestOvulationDay = null;
    let bestConfidence = 'low';
    
    // Check for 3-over-6 pattern in a sliding window
    for (let i = 6; i < validEntries.length - 2; i++) {
        const sixDays = validEntries.slice(i - 6, i);
        const threeDays = validEntries.slice(i, i + 3);
        
        // Calculate gaps between first and last day of the 9-day window
        const firstDay = parseLocalDate(sixDays[0].date);
        const lastDay = parseLocalDate(threeDays[2].date);
        const totalDays = daysBetween(firstDay, lastDay);
        
        // Skip if the pattern is too spread out
        if (totalDays > 14) continue;
        
        const sixDayAvg = sixDays.reduce((sum, entry) => sum + entry.temperature, 0) / 6;
        
        // Check if next 3 days are all above the average
        const isRise = threeDays.every(day => day.temperature > sixDayAvg + 0.2);
        
        if (isRise) {
            const ovulationDate = parseLocalDate(validEntries[i - 1].date);
            // Calculate confidence based on data quality
            const confidence = calculateConfidence(sixDays, threeDays, sixDayAvg);
            
            // Update best match if this one has higher confidence
            if (!bestOvulationDay || confidence.level > bestConfidence.level) {
                bestOvulationDay = ovulationDate;
                bestConfidence = confidence;
            }
        }
    }
    
    return {
        date: bestOvulationDay,
        confidence: bestConfidence.level,
        message: bestOvulationDay ? 
            `Ovulation detected with ${bestConfidence.level} confidence` :
            'No clear ovulation pattern detected'
    };
}

/**
 * Calculate confidence level of ovulation detection
 */
function calculateConfidence(sixDays, threeDays, sixDayAvg) {
    // Count how many of the 3 days are significantly above the average
    const significantRiseCount = threeDays
        .filter(day => day.temperature > sixDayAvg + 0.3)
        .length;
    
    // Calculate temperature stability in baseline
    const baselineTemps = sixDays.map(day => day.temperature);
    const baselineStability = calculateStability(baselineTemps);
    
    // Calculate rise consistency
    const riseAmounts = threeDays.map(day => day.temperature - sixDayAvg);
    const riseConsistency = calculateStability(riseAmounts);
    
    // Determine confidence level
    if (significantRiseCount >= 2 && baselineStability < 0.2 && riseConsistency < 0.3) {
        return { level: 'high', details: 'Strong temperature shift with stable baseline' };
    } else if (significantRiseCount >= 1 && baselineStability < 0.3) {
        return { level: 'medium', details: 'Moderate temperature shift' };
    }
    
    return { level: 'low', details: 'Weak or inconsistent temperature pattern' };
}

/**
 * Calculate stability of temperature readings (lower is more stable)
 */
function calculateStability(readings) {
    if (readings.length < 2) return 0;
    
    const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
    const squareDiffs = readings.map(x => Math.pow(x - avg, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / readings.length;
    return Math.sqrt(variance); // standard deviation
}

// Update the UI to show confidence information
function updateOvulationInfo(entries) {
    const result = calculateOvulationDate(entries);
    const ovulationInfo = document.getElementById('ovulationInfo');
    
    if (result.date) {
        const formattedDate = formatDate(result.date.toISOString().split('T')[0]);
        ovulationInfo.innerHTML = `
            <div class="prediction ${result.confidence}">
                <h3>Most Likely Ovulation Date</h3>
                <p class="date">${formattedDate}</p>
                <p class="confidence">Confidence: ${result.confidence}</p>
                <p class="details">${result.message}</p>
            </div>
        `;
    } else {
        ovulationInfo.innerHTML = `
            <div class="prediction">
                <p>${result.message}</p>
                <p class="hint">Track your temperature daily for more accurate predictions.</p>
            </div>
        `;
    }
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

// Export entries to CSV
function exportToCSV() {
    const entries = getEntries();
    if (entries.length === 0) {
        alert('No entries to export');
        return;
    }

    // Convert entries to CSV format
    const headers = ['Date', 'Temperature (°C)', 'Notes'];
    const csvRows = [
        headers.join(','),
        ...entries.map(entry => {
            const date = entry.date;
            const temp = entry.temperature.toFixed(2);
            const notes = `"${(entry.notes || '').replace(/"/g, '""')}"`; // Escape quotes in notes
            return [date, temp, notes].join(',');
        })
    ];

    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `temperature-tracker-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import entries from CSV
function importFromCSV(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Validate CSV format
            if (headers.length < 2 || 
                !headers.some(h => h.toLowerCase().includes('date')) ||
                !headers.some(h => h.toLowerCase().includes('temperature'))) {
                throw new Error('Invalid CSV format. Please use the exported CSV file format.');
            }
            
            // Get existing entries
            const existingEntries = getEntries();
            const existingEntryMap = new Map(existingEntries.map(entry => [entry.date, entry]));
            let importedCount = 0;
            let skippedCount = 0;
            
            // Process each line
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                try {
                    // Simple CSV parsing (won't handle all edge cases, but works for our format)
                    const values = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let j = 0; j < lines[i].length; j++) {
                        const char = lines[i][j];
                        if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            values.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current);
                    
                    if (values.length < 2) continue;
                    
                    // Extract values (assuming format: date, temperature, notes)
                    const date = values[0].trim();
                    const temp = parseFloat(values[1].trim());
                    const notes = values.length > 2 ? values[2].trim().replace(/^"|"$/g, '') : '';
                    
                    // Validate date and temperature
                    if (!date || isNaN(temp) || !isValidDate(date)) continue;
                    
                    // Create or update entry
                    const entry = {
                        id: existingEntryMap.has(date) ? existingEntryMap.get(date).id : Date.now() + Math.random().toString(36).substr(2, 9),
                        date,
                        temperature: temp,
                        notes: notes || '',
                        timestamp: existingEntryMap.has(date) 
                            ? existingEntryMap.get(date).timestamp 
                            : new Date().toISOString(),
                        // Preserve fever status for existing entries, detect for new entries
                        fever: existingEntryMap.has(date) 
                            ? existingEntryMap.get(date).fever 
                            : temp >= 38.0 // Mark as fever if temperature is 38.0°C or higher
                    };
                    
                    saveEntry(entry);
                    importedCount++;
                    
                } catch (error) {
                    console.error('Error processing line:', lines[i], error);
                    skippedCount++;
                }
            }
            
            // Reload entries and show success message
            loadEntries();
            
            let message = `Successfully imported ${importedCount} entries.`;
            if (skippedCount > 0) {
                message += ` ${skippedCount} entries were skipped due to errors.`;
            }
            alert(message);
            
        } catch (error) {
            console.error('Error importing CSV:', error);
            alert(`Error importing CSV: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file');
    };
    
    reader.readAsText(file);
}

// Helper function to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime()) && d.toISOString().slice(0,10) === dateString;
}

// Initialize backup functionality
document.addEventListener('DOMContentLoaded', () => {
    // Previous initialization code...
    
    // Initialize backup buttons
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (confirm('Importing will add new entries and update existing ones. Continue?')) {
                    importFromCSV(file);
                }
            }
            // Reset the file input to allow importing the same file again
            e.target.value = '';
        });
    }
    
    // Rest of the initialization code...
});

// Add some CSS for the fever flag
const style = document.createElement('style');
style.textContent = `
    .fever-flag {
        color: #e53935;
        font-weight: 500;
        margin: 5px 0;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .fever-flag::before {
        content: "🤒";
        font-size: 1.2em;
    }
`;
document.head.appendChild(style);
