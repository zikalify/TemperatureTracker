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

// Load and display entries
function loadEntries() {
    const entries = getEntries();
    entriesList.innerHTML = '';
    
    if (entries.length === 0) {
        entriesList.innerHTML = '<p>No entries yet. Add your first temperature reading above.</p>';
        updateOvulationInfo(entries);
        return;
    }
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
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
    
    updateOvulationInfo(entries);
}

// Calculate most likely ovulation date based on temperature data
function calculateOvulationDate(entries) {
    if (!entries || entries.length < 7) {
        return null; // Not enough data to determine ovulation
    }

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Look for a sustained temperature rise of at least 0.2°C above the previous 6 days' average
    for (let i = 6; i < sortedEntries.length; i++) {
        const currentTemp = parseFloat(sortedEntries[i].temperature);
        const previousTemps = sortedEntries.slice(i - 6, i).map(entry => parseFloat(entry.temperature));
        const avgPrevTemp = previousTemps.reduce((sum, temp) => sum + temp, 0) / 6;
        
        // If current temperature is at least 0.2°C higher than the average of previous 6 days
        if (currentTemp >= avgPrevTemp + 0.2) {
            // Check if this is a sustained rise (next 2 days are also higher)
            const nextDay1 = i + 1 < sortedEntries.length ? parseFloat(sortedEntries[i + 1].temperature) : null;
            const nextDay2 = i + 2 < sortedEntries.length ? parseFloat(sortedEntries[i + 2].temperature) : null;
            
            if ((!nextDay1 || nextDay1 > avgPrevTemp) && (!nextDay2 || nextDay2 > avgPrevTemp)) {
                // Return the date of the first temperature rise (ovulation typically occurs 1-2 days before this)
                return new Date(sortedEntries[i - 1].date);
            }
        }
    }
    
    return null; // No clear ovulation detected
}

// Update ovulation information display
function updateOvulationInfo(entries) {
    if (!entries || entries.length === 0) {
        ovulationInfo.innerHTML = '<p>Add at least 7 days of temperature data to estimate your ovulation date.</p>';
        return;
    }
    
    const ovulationDate = calculateOvulationDate([...entries].sort((a, b) => new Date(a.date) - new Date(b.date)));
    
    if (ovulationDate) {
        ovulationInfo.innerHTML = `
            <p><strong>Most likely previous ovulation:</strong> ${formatDate(ovulationDate.toISOString().split('T')[0])}</p>
            <p class="info-note">Based on your temperature data. Ovulation typically occurs 1-2 days before a sustained temperature rise.</p>
        `;
    } else {
        if (entries.length < 7) {
            const daysNeeded = 7 - entries.length;
            ovulationInfo.innerHTML = `
                <p>Not enough data to estimate ovulation. Add ${daysNeeded} more day${daysNeeded > 1 ? 's' : ''} of temperature data.</p>
            `;
        } else {
            ovulationInfo.innerHTML = `
                <p>No clear ovulation pattern detected in your temperature data.</p>
                <p class="info-note">Keep tracking your temperature daily for more accurate predictions.</p>
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