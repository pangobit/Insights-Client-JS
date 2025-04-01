// Import the client from the root index.js (which exports from src/insightsClient.js)
import InsightsClient from '../index.js';

// Initialize the client
// Pass configuration options, including the target API endpoint and debug flag
const insights = new InsightsClient({
    targetApi: '/api/track', // Replace with your actual API endpoint
    debug: true // Enable debug logging in the console
});

// --- Example Interaction Logic (Simplified) ---

const contentDiv = document.getElementById('content');
const customEventButton = document.getElementById('customEventButton'); // Keep this for the *manual* custom event

// Simple client-side routing simulation based on hash changes
// This function ONLY updates the content now, tracking is handled by the client
function updateContent() {
    const hash = window.location.hash || '#home';
    contentDiv.innerHTML = `<p>Content for <strong>${hash.substring(1)}</strong> page.</p>`;
}

// Add event listener for hash changes to update content
window.addEventListener('hashchange', updateContent);

// Initial content update on page load
document.addEventListener('DOMContentLoaded', updateContent);

// Example of sending a *manual* custom event (distinct from automatic button tracking)
customEventButton.addEventListener('click', () => {
    insights.reportEvent('CustomUserAction', { detail: 'User clicked the special button', timestamp: Date.now() });
});

// Automatic button click tracking is handled by the InsightsClient instance.
// Automatic route change tracking is handled by the InsightsClient instance.

console.log('Example app initialized. Insights Client instance:', insights);
