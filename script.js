// --- CONFIGURATION ---
// Change this IP to your ESP32's actual IP address
const ESP32_URL = 'http://10.96.116.112/data';

// Auto-refresh interval in milliseconds (2000ms = 2 seconds)
const REFRESH_INTERVAL = 2000;
// ---------------------

// DOM Elements
const tempValue = document.getElementById('temp-value');
const humValue = document.getElementById('hum-value');
const soilValue = document.getElementById('soil-value');
const rainValue = document.getElementById('rain-value');
const lightValue = document.getElementById('light-value');

const soilStatus = document.getElementById('soil-status');
const rainStatus = document.getElementById('rain-status');
const lightStatus = document.getElementById('light-status');

const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

// Chart Setup
const ctx = document.getElementById('weatherChart').getContext('2d');
const maxDataPoints = 15; // How many points to show on the graph

// Initialize Chart.js
const weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Time labels will go here
        datasets: [
            {
                label: 'Temperature (°C)',
                borderColor: '#fb7185',
                backgroundColor: 'rgba(251, 113, 133, 0.1)',
                data: [],
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'Humidity (%)',
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                data: [],
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#f8fafc' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Temp (°C)', color: '#fb7185' },
                ticks: { color: '#fb7185' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Humidity (%)', color: '#38bdf8' },
                ticks: { color: '#38bdf8' },
                grid: { drawOnChartArea: false } // Prevent grid line overlap
            }
        }
    }
});

// Function to update the UI with new data
function updateDashboard(data) {
    // 1. Update Values
    tempValue.innerText = data.temperature !== undefined ? data.temperature.toFixed(1) : '--';
    humValue.innerText = data.humidity !== undefined ? data.humidity.toFixed(1) : '--';
    soilValue.innerText = data.soil !== undefined ? data.soil : '--';
    rainValue.innerText = data.rain !== undefined ? data.rain : '--';
    lightValue.innerText = data.light !== undefined ? data.light : '--';

    // 2. Update Status Indicators

    // Soil Status: Lower value usually means wetter for analog soil sensors, but let's assume < 400 is wet, else dry.
    if (data.soil !== undefined) {
        if (data.soil < 400) {
            soilStatus.innerText = "Wet";
            soilStatus.className = "status-badge status-wet";
        } else {
            soilStatus.innerText = "Dry";
            soilStatus.className = "status-badge status-dry";
        }
    }

    // Rain Status: Assuming 0 = Rain Detected, 1 (or high value) = No Rain.
    if (data.rain !== undefined) {
        if (data.rain < 100) {
            rainStatus.innerText = "Rain Detected";
            rainStatus.className = "status-badge status-rain";
        } else {
            rainStatus.innerText = "No Rain";
            rainStatus.className = "status-badge status-norain";
        }
    }

    // Light Status: High LDR value = bright/day, Low value = dark/night
    if (data.light !== undefined) {
        if (data.light > 400) {
            lightStatus.innerText = "Day";
            lightStatus.className = "status-badge status-day";
        } else {
            lightStatus.innerText = "Night";
            lightStatus.className = "status-badge status-night";
        }
    }

    // 3. Update Chart
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0') + ':' +
        now.getSeconds().toString().padStart(2, '0');

    // Add new labels and data
    weatherChart.data.labels.push(timeString);
    weatherChart.data.datasets[0].data.push(data.temperature);
    weatherChart.data.datasets[1].data.push(data.humidity);

    // Remove oldest data if we exceed max points
    if (weatherChart.data.labels.length > maxDataPoints) {
        weatherChart.data.labels.shift();
        weatherChart.data.datasets[0].data.shift();
        weatherChart.data.datasets[1].data.shift();
    }

    weatherChart.update();
}

// Function to set connection status UI
function setConnectionStatus(connected) {
    if (connected) {
        statusIndicator.className = "indicator online";
        statusText.innerText = "ESP32 Connected";
        statusText.style.color = "#4ade80"; // green
    } else {
        statusIndicator.className = "indicator offline";
        statusText.innerText = "ESP32 Disconnected";
        statusText.style.color = "#fb7185"; // red
    }
}

// Main function to fetch data from ESP32
async function fetchData() {
    try {
        // Add a cache-busting timestamp to prevent browser from caching the JSON response
        const response = await fetch(`${ESP32_URL}?t=${new Date().getTime()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update UI with real data
        updateDashboard(data);
        setConnectionStatus(true);

    } catch (error) {
        console.error("Error fetching data from ESP32:", error);

        // If ESP32 is offline, show disconnected status
        setConnectionStatus(false);

        // Generate dummy data for testing the UI when ESP32 is offline
        generateDummyData();
    }
}

// Function to generate dummy data if ESP32 is offline
function generateDummyData() {
    const dummyData = {
        temperature: 25 + (Math.random() * 10 - 5), // 20 to 30
        humidity: 60 + (Math.random() * 20 - 10),   // 50 to 70
        soil: Math.floor(Math.random() * 800),      // 0 to 800
        rain: Math.random() > 0.8 ? 0 : 1023,       // occasional rain
        light: Math.floor(Math.random() * 1024)     // 0 to 1024
    };

    updateDashboard(dummyData);
}

// Initial fetch when page loads
fetchData();

// Set interval to continuously fetch data
setInterval(fetchData, REFRESH_INTERVAL);
