// Initialize theme on page load
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set theme: saved preference > system preference > light
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

// Set theme and update DOM
function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateToggleIcon('☀️');
  } else {
    document.documentElement.removeAttribute('data-theme');
    updateToggleIcon('🌙');
  }
  localStorage.setItem('theme', theme);
}

// Update toggle button icon
function updateToggleIcon(icon) {
  const toggleIcon = document.querySelector('.toggle-icon');
  if (toggleIcon) {
    toggleIcon.textContent = icon;
  }
}

// Get current theme
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

// Toggle theme
function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Make API request
async function makeRequest() {
  const method = document.getElementById('method').value;
  const endpoint = document.getElementById('endpoint').value;
  const body = document.getElementById('body').value;
  const responseDiv = document.getElementById('response');
  const responseBody = document.getElementById('responseBody');

  // Reset response classes
  responseDiv.classList.remove('show', 'success', 'error');

  // Validate endpoint
  if (!endpoint.trim()) {
    responseBody.textContent = 'Error: Endpoint is required';
    responseDiv.classList.add('show', 'error');
    return;
  }

  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add body for non-GET requests
    if (method !== 'GET' && body.trim()) {
      try {
        JSON.parse(body);
        options.body = body;
      } catch (e) {
        responseBody.textContent = 'Error: Invalid JSON in request body';
        responseDiv.classList.add('show', 'error');
        return;
      }
    }

    const response = await fetch(`proxy.php?path=${encodeURIComponent(endpoint)}`, options);
    const data = await response.text();

    responseBody.textContent = data;
    responseDiv.classList.add('show', 'success');
  } catch (error) {
    responseBody.textContent = `Error: ${error.message}`;
    responseDiv.classList.add('show', 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initializeTheme();

  // Theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Send request button
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', makeRequest);
  }

  // Allow Enter key in textarea to submit with Ctrl+Enter
  const bodyTextarea = document.getElementById('body');
  if (bodyTextarea) {
    bodyTextarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        makeRequest();
      }
    });
  }
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});
