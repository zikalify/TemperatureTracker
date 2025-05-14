// DOM Elements
const tempForm = document.getElementById('tempForm');
const entriesList = document.getElementById('entriesList');
const chartCanvas = document.getElementById('temperatureChart');

// Initialize chart
let temperatureChart;

// Set default date to today and format it
document.addEventListener('DOMContentLoaded', () => {
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
    
    initializeChart();
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
    const temperature = parseFloat(document.getElementById('temperature').value);
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
    } else {
        // Sort entries by date (newest first)
        const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedEntries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = 'entry-card';
            entryElement.innerHTML = `
                <div class="entry-date">${formatDate(entry.date)}</div>
                <div class="entry-temp">${entry.temperature}°C</div>
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
        
        updateChart(entries);
    }
}

// Initialize chart
function initializeChart() {
    const ctx = chartCanvas.getContext('2d');
    
    // Register the zoom/pan plugin
    Chart.register(ChartZoom);
    
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Temperature (°C)',
                borderColor: '#9c27b0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Disable animations for better performance during zoom/pan
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    ticks: {
                        precision: 2
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}°C`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: null, // Remove shift key requirement
                        scaleMode: 'x',
                        threshold: 10,
                        speed: 20,
                        speedMultiplier: 0.5
                    },
                    zoom: {
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(156, 39, 176, 0.2)',
                            borderColor: 'rgba(156, 39, 176, 0.8)',
                            borderWidth: 1,
                            threshold: 10
                        },
                        wheel: {
                            enabled: true,
                            speed: 0.1,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        onZoomComplete: function({ chart }) {
                            // This prevents the chart from resetting the zoom level
                            chart.update('none');
                        }
                    }
                }
            }
        }
    });
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

// Update chart with entries
function updateChart(entries) {
    if (!temperatureChart || !entries || entries.length === 0) {
        return;
    }
    
    try {
        // Sort entries by date (newest first)
        const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedEntries.length === 0) return;
        
        // Update ovulation date display
        const ovulationDate = calculateOvulationDate([...sortedEntries].reverse()); // Need to reverse for ovulation calculation
        const ovulationElement = document.getElementById('ovulationDate');
        if (ovulationDate) {
            ovulationElement.textContent = `Most likely previous ovulation: ${formatDate(ovulationDate.toISOString().split('T')[0])}`;
            ovulationElement.style.display = 'block';
        } else {
            ovulationElement.style.display = 'none';
        }
        
        // Determine how many days to show based on screen width
        let daysToShow;
        const screenWidth = window.innerWidth;
        
        if (screenWidth < 480) {         // Mobile
            daysToShow = 14;             // 2 weeks on very small screens
        } else if (screenWidth < 768) {  // Small tablets
            daysToShow = 21;             // 3 weeks on small tablets
        } else if (screenWidth < 1024) { // Tablets
            daysToShow = 28;             // 4 weeks on tablets
        } else {                         // Desktops and larger
            daysToShow = 35;             // 5 weeks on desktops
        }
        
        // Calculate the cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
        
        // Filter entries to only include recent ones
        const recentEntries = sortedEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate;
        });
        
        if (recentEntries.length === 0) {
            // If no recent entries, just use the most recent one
            recentEntries.push(sortedEntries[0]);
        }
        
        // Sort recent entries by date (oldest first for the chart)
        recentEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create data points with breaks for missing dates
        const data = [];
        const labels = [];
        
        // Convert all dates to Date objects for comparison
        const dateObjects = recentEntries.map(entry => ({
            date: new Date(entry.date),
            temperature: parseFloat(entry.temperature)
        }));
        
        // Start from the first date or cutoff date, whichever is more recent
        const startDate = new Date(Math.max(
            dateObjects[0].date.getTime(),
            cutoffDate.getTime()
        ));
        
        const endDate = new Date(dateObjects[dateObjects.length - 1].date);
        
        let currentDate = new Date(startDate);
        let dataIndex = 0;
        
        // Loop through each day in the range
        while (currentDate <= endDate) {
            const currentDateStr = currentDate.toISOString().split('T')[0];
            const formattedDate = formatDate(currentDateStr);
            
            // Check if we have data for this date
            if (dataIndex < dateObjects.length && 
                dateObjects[dataIndex].date.toISOString().split('T')[0] === currentDateStr) {
                // We have data for this date
                data.push({
                    x: formattedDate,
                    y: dateObjects[dataIndex].temperature
                });
                dataIndex++;
            } else {
                // No data for this date, add a break
                data.push({
                    x: formattedDate,
                    y: null
                });
            }
            
            labels.push(formattedDate);
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Update chart data
        temperatureChart.data.labels = labels;
        temperatureChart.data.datasets[0].data = data;
        
        // Adjust y-axis range based on temperature values (only non-null values)
        const temps = data.filter(point => point.y !== null).map(point => point.y);
        if (temps.length > 0) {
            const minTemp = Math.min(...temps);
            const maxTemp = Math.max(...temps);
            temperatureChart.options.scales.y.min = Math.floor(minTemp - 0.5);
            temperatureChart.options.scales.y.max = Math.ceil(maxTemp + 0.5);
        }
        
        // Configure the dataset to show gaps for null values
        temperatureChart.data.datasets[0].spanGaps = false;
        
        // Adjust x-axis tick configuration based on number of days
        temperatureChart.options.scales.x.ticks = {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: Math.min(10, daysToShow) // Show at most 10 labels
        };
        
        temperatureChart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Add event listener for window resize to update the chart when screen size changes
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const entries = getEntries();
        updateChart(entries);
    }, 250); // Debounce resize events
});

// Helper function to update date display
function updateDateDisplay(inputElement, displayElement) {
    if (!inputElement.value) return;
    
    const selectedDate = new Date(inputElement.value);
    const formatted = selectedDate.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
    
    // Update the display element
    if (displayElement) {
        displayElement.textContent = formatted;
    }
    
    // Set the title for better accessibility
    inputElement.title = `Selected date: ${formatted}`;
}

// Edit entry
function editEntry(id) {
    const entries = getEntries();
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        document.getElementById('editId').value = entry.id;
        document.getElementById('editDate').value = entry.date;
        document.getElementById('editTemperature').value = entry.temperature;
        document.getElementById('editNotes').value = entry.notes || '';
        
        document.getElementById('editModal').style.display = 'block';
    }
}

// Handle edit form submission
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const date = document.getElementById('editDate').value;
    const temperature = parseFloat(document.getElementById('editTemperature').value);
    const notes = document.getElementById('editNotes').value;
    
    const entries = getEntries();
    const index = entries.findIndex(e => e.id === id);
    
    if (index !== -1) {
        entries[index] = { id, date, temperature, notes };
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
    if (!dateString) return '';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}