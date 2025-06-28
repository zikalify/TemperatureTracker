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
        
        // Display temperature with exact value from storage
        const currentUnit = getCurrentUnit();
        if (currentUnit === 'C') {
            editTemperature.value = entry.temperature;
        } else {
            const fahrenheit = celsiusToFahrenheit(entry.temperature);
            editTemperature.value = fahrenheit.toFixed(2);
        }
        
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

// Utility function to handle temperature display without altering the value
function formatTempForDisplay(temp) {
    // Simply return the number as is - let toFixed handle the display
    return temp;
}

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

// Format temperature for display with 2 decimal places
function formatTemperature(temp, withUnit = true) {
    const isCelsius = getCurrentUnit() === 'C';
    let displayTemp = parseFloat(temp);
    
    if (!isCelsius) {
        // Convert to Fahrenheit
        displayTemp = (displayTemp * 9/5) + 32;
    }
    
    // Format with exactly 2 decimal places for display
    const formatted = displayTemp.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return withUnit ? `${formatted}°${isCelsius ? 'C' : 'F'}` : formatted;
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
    
    // Convert the input temperature to a number, handling both comma and dot
    let temperature;
    try {
        // Replace comma with dot and parse as float
        const normalizedInput = tempInput.replace(',', '.');
        temperature = parseFloat(normalizedInput);

        if (isNaN(temperature)) {
            throw new Error('Invalid number');
        }

        // Round user input to 2 decimal places
        temperature = parseFloat(temperature.toFixed(2));
    } catch (error) {
        alert('Please enter a valid temperature (e.g., 36.75 or 36,75)');
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
    
    // Keep the temperature value with 4 decimal places for precision
    temperature = parseFloat(temperature.toFixed(4));
    
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
    const tempStr = tempInput.value.replace(',', '.');
    let temp = parseFloat(tempStr);

    if (isNaN(temp)) {
        alert('Please enter a valid temperature.');
        return;
    }
    
    // Round user input to 2 decimal places.
    temp = parseFloat(temp.toFixed(2));
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
    // Keep the selected date instead of resetting to today
    dateInput.value = entry.date;
}

// Save entry to local storage
function saveEntry(entry) {
    const entries = getEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);

    // Ensure temperature is stored with high precision (4 decimal places) to avoid rounding errors
    if (typeof entry.temperature === 'number') {
        entry.temperature = parseFloat(entry.temperature.toFixed(4));
    }

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
    
    // Find the latest entry date
    const latestEntry = sortedEntries[sortedEntries.length - 1];
    const latestDate = parseLocalDate(latestEntry.date);
    
    // Calculate start date as 30 days before latest entry
    const lookbackDays = 30;
    const startDate = new Date(latestDate);
    startDate.setDate(latestDate.getDate() - lookbackDays);
    
    // Get valid entries within date range
    const validEntries = sortedEntries.filter(entry => {
        const entryDate = parseLocalDate(entry.date);
        return entryDate >= startDate && entryDate <= latestDate;
    });
    
    if (validEntries.length < 4) {
        return { 
            date: null, 
            confidence: 'low', 
            message: `Need at least 4 valid readings (have ${validEntries.length})` 
        };
    }
    
    let bestOvulationDay = null;
    let bestConfidence = 'low';
    
    let sixDayWindow = [];

    // Check for 3-over-flexible window pattern
    for (let i = 3; i < validEntries.length - 2; i++) {
        // Reset window for each iteration
        let sixDayWindow = [];
        // Get the last 6 calendar days of data (not necessarily 6 entries)
        const currentDate = parseLocalDate(validEntries[i].date);
        const sixDaysAgo = new Date(currentDate);
        sixDaysAgo.setDate(currentDate.getDate() - 6);
        // Move sixDaysAgo back by one more day
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 1);
        // Create array of all dates in the 6-day window
        const windowDates = [];
        for (let d = new Date(sixDaysAgo); d < currentDate; d.setDate(d.getDate() + 1)) {
            windowDates.push(new Date(d).toISOString().split('T')[0]);
        }
        // Get entries for each date in the window
        windowDates.forEach(date => {
            const entry = validEntries.find(e => e.date === date);
            if (entry) sixDayWindow.push(entry);
        });
            
        // Skip if we don't have enough days with data in the window
        if (sixDayWindow.length < 4) continue;
            
        // Get the 3 days after the window
        const threeDays = validEntries
            .filter(entry => {
                const entryDate = parseLocalDate(entry.date);
                return entryDate >= currentDate && 
                       entryDate <= new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            });
            
        if (threeDays.length < 3) continue;
        
        // Calculate the average of the 6-day window
        const sixDayAvg = sixDayWindow.reduce((sum, entry) => sum + entry.temperature, 0) / sixDayWindow.length;
        
        // Check if next 3 days are all above the average
        const isRise = threeDays.every(day => day.temperature > sixDayAvg + 0.2);
        
        if (isRise) {
            const ovulationDate = new Date(currentDate);
            ovulationDate.setDate(ovulationDate.getDate() - 1); // Day before the rise
            
            // Calculate confidence based on data quality and number of entries
            const confidence = calculateConfidence(sixDayWindow, threeDays, sixDayAvg);
            
            // Adjust confidence based on number of entries in the 6-day window
            if (sixDayWindow.length < 6) {
                if (confidence.level === 'high') confidence.level = 'medium';
                else if (confidence.level === 'medium') confidence.level = 'low';
                confidence.details += ` (only ${sixDayWindow.length} of 6 days with data)`;
            }
            
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

function calculateConfidence(sixDays, threeDays, sixDayAvg) {
    // 1. Calculate data completeness
    const dataDensity = sixDays.length / 6;
    let confidence = { level: 'low', details: '' };

    // 2. Calculate temperature rise metrics
    const riseAmounts = threeDays.map(day => day.temperature - sixDayAvg);
    const significantRiseCount = riseAmounts.filter(rise => rise >= 0.15).length; // Reduced threshold for significant rise
    const avgRise = riseAmounts.reduce((a, b) => a + b, 0) / riseAmounts.length;
    
    // 3. Analyze baseline stability
    const baselineTemps = sixDays.map(day => day.temperature);
    const baselineStability = calculateStability(baselineTemps);
    
    // 4. Calculate rise consistency (more lenient calculation)
    const riseStability = calculateStability(threeDays.map(day => day.temperature));
    const isConsistentRise = riseAmounts.every((val, i, arr) => i === 0 || val >= arr[i-1] - 0.1);
    
    // 5. Check for sustained rise over more days if needed
    const extendedRiseDays = riseAmounts.filter((val, i, arr) => {
        // Look for at least 3 out of 4 days with rising or stable temps
        if (i < 3) return true;
        const window = arr.slice(i-3, i+1);
        return window.every((v, idx) => idx === 0 || v >= window[idx-1] - 0.1);
    }).length;
    
    // 6. Determine base confidence (more lenient criteria)
    if (avgRise >= 0.3 && baselineStability < 0.3) {
        confidence = { 
            level: 'high', 
            details: 'Clear temperature shift with stable baseline' 
        };
    } else if (avgRise >= 0.2 || (significantRiseCount >= 2 && isConsistentRise)) {
        confidence = { 
            level: 'medium', 
            details: 'Moderate temperature shift detected' 
        };
    } else if (extendedRiseDays >= 3) {
        confidence = { 
            level: 'medium',
            details: 'Sustained temperature rise detected over multiple days'
        };
    }
    
    // 7. Adjust for data quality - be strict with missing data
    if (dataDensity < 1) {
        if (dataDensity < 0.67) {  // Less than 4 out of 6 days
            confidence = { 
                level: 'low', 
                details: 'Insufficient data in baseline period (need at least 4 of 6 days)' 
            };
        } else if (confidence.level === 'high' && dataDensity < 0.85) {
            confidence.level = 'medium';
            confidence.details += ' (reduced confidence due to missing data)';
        } else if (confidence.level === 'medium' && dataDensity < 0.67) {
            confidence.level = 'low';
            confidence.details += ' (reduced confidence due to missing data)';
        }
    }
    
    // 8. If we have sufficient data and a clear pattern, be more lenient with confidence
    if (dataDensity >= 0.67) {  // At least 4 out of 6 days
    // If we have a clear temperature rise pattern
    if (avgRise >= 0.2 || (significantRiseCount >= 2 && isConsistentRise)) {
        // If we have 5–6 days of data, allow medium confidence
        if (dataDensity >= 0.83) {
            if (confidence.level !== 'high') {
                confidence = { 
                    level: 'medium',
                    details: 'Clear temperature pattern detected with good data coverage' 
                };
            }
        } else if (confidence.level === 'low') {
            // With 4 days, be more cautious but still acknowledge the pattern
            confidence = { 
                level: 'medium',
                details: 'Possible temperature shift detected (moderate data coverage)' 
            };
        }
    }
}
    
    return confidence;
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

// Detects a possible ovulation dip: latest temp is significantly below the average of last 6 calendar days
function checkEarlyWarningDip(entries) {
    if (!entries || entries.length < 3) return { showWarning: false, dipDate: null };
    const sorted = [...entries].filter(e => !e.fever).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sorted.length < 3) return { showWarning: false, dipDate: null };
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const sixDaysAgo = new Date(lastDate);
    sixDaysAgo.setDate(lastDate.getDate() - 5);
    const lastSixDays = sorted.filter(e => {
        const d = new Date(e.date);
        return d >= sixDaysAgo && d <= lastDate;
    });
    if (lastSixDays.length < 3) return { showWarning: false, dipDate: null };
    const temps = lastSixDays.slice(0, -1).map(e => e.temperature);
    if (temps.length < 2) return { showWarning: false, dipDate: null };
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const latest = lastSixDays[lastSixDays.length - 1];
    if (latest.temperature < avg - 0.15) {
        return { showWarning: true, dipDate: latest.date };
    }
    return { showWarning: false, dipDate: null };
}

// Update the UI to show confidence information
function updateOvulationInfo(entries) {
    const result = calculateOvulationDate(entries);
    const ovulationInfo = document.getElementById('ovulationInfo');
    // Always re-evaluate dip warning: if a dip is present in the latest entry and not refuted/confirmed, set it
    let dipData = null;
    let clearDip = false;
    // Find the latest dip in the entries
    let warningResult = { showWarning: false, dipDate: null };
    // Only consider dips in the most recent 40 days
    const entriesSorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    let recentEntries = entriesSorted;
    if (entriesSorted.length > 0) {
        const latestDate = new Date(entriesSorted[entriesSorted.length - 1].date);
        const windowStart = new Date(latestDate);
        windowStart.setDate(latestDate.getDate() - 39);
        recentEntries = entriesSorted.filter(e => new Date(e.date) >= windowStart);
    }
    // Find the latest dip in the recent entries only
    for (let i = recentEntries.length - 1; i >= 0; i--) {
        const subEntries = recentEntries.slice(0, i + 1);
        const dipCheck = checkEarlyWarningDip(subEntries);
        if (dipCheck.showWarning) {
            warningResult = dipCheck;
            break;
        }
    }
    if (warningResult.showWarning) {
        const dipDateObj = new Date(warningResult.dipDate);
        // New logic: clear dip if latest entry is 3 or more days after the dip
        if (entriesSorted.length > 0) {
            const latestEntryDate = new Date(entriesSorted[entriesSorted.length - 1].date);
            const daysSinceDip = (latestEntryDate - dipDateObj) / (1000 * 60 * 60 * 24);
            if (daysSinceDip >= 3) {
                clearDip = true;
                localStorage.removeItem('dipWarning');
            }
        }
        if (!clearDip && result.date && new Date(result.date) >= dipDateObj) {
            clearDip = true;
            localStorage.removeItem('dipWarning');
        } else if (!clearDip) {
            const entriesAfterDip = entries.filter(e => new Date(e.date) > dipDateObj && !e.fever);
            const dipTemp = entries.find(e => e.date === warningResult.dipDate)?.temperature;
            if (entriesAfterDip.length >= 4 && dipTemp !== undefined) {
                const riseCount = entriesAfterDip.slice(0, 4).filter(e => e.temperature > dipTemp + 0.2).length;
                if (riseCount < 3) {
                    clearDip = true;
                    localStorage.removeItem('dipWarning');
                }
            }
            if (!clearDip) {
                dipData = { show: true, dipDate: warningResult.dipDate };
                localStorage.setItem('dipWarning', JSON.stringify(dipData));
            }
        }
    } else {
        localStorage.removeItem('dipWarning');
    }
    dipData = JSON.parse(localStorage.getItem('dipWarning')) || null;
    let dipWarningHtml = '';
    if ((!result.date || (dipData && dipData.dipDate && result.date && new Date(result.date) < new Date(dipData.dipDate))) && dipData && dipData.show) {
        let windowStart = '', windowEnd = '';
        if (dipData.dipDate) {
            const dipDateObj = new Date(dipData.dipDate);
            const start = new Date(dipDateObj);
            const end = new Date(dipDateObj);
            end.setDate(end.getDate() + 2);
            windowStart = formatDate(start.toISOString().split('T')[0]);
            windowEnd = formatDate(end.toISOString().split('T')[0]);
        }
        dipWarningHtml = `<p class="warning">⚠️ Possible ovulation dip detected. Ovulation may be between ${windowStart} and ${windowEnd}.<br><span class='info-note'>This is a potentially fertile window; unprotected sex during this time may result in pregnancy.</span></p>`;
    }
    if (result.date) {
        const formattedDate = formatDate(result.date.toISOString().split('T')[0]);
        ovulationInfo.innerHTML = `
            <div class="prediction ${result.confidence}">
                <h3>Most Likely Ovulation Date</h3>
                <p class="date">${formattedDate}</p>
                <p class="confidence">Confidence: ${result.confidence}</p>
                <p class="details">${result.message}</p>
            </div>
            ${dipWarningHtml}
        `;
    } else {
        ovulationInfo.innerHTML = `
            <div class="prediction">
                <p>${result.message}</p>
                <p class="hint">Track your temperature daily for more accurate predictions.</p>
            </div>
            ${dipWarningHtml}
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

// After finding the latest dip, check if the dip entry still exists
if (dipData && dipData.dipDate && !entries.some(e => e.date === dipData.dipDate)) {
    localStorage.removeItem('dipWarning');
    dipData = null;
}
