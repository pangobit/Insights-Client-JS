class InsightsClient {
    constructor(config = {}) {
        // Default configuration
        const defaultConfig = {
            targetApi: null, // Default to null, requiring configuration
            debug: false // Optional debug flag
        };
        this.config = { ...defaultConfig, ...config };

        if (!this.config.targetApi) {
            console.warn('InsightsClient: targetApi not provided in config. Data will only be logged to console.');
        }

        this.initialize();
    }

    initialize() {
        console.log('InsightsClient Initialized');
        // Initialization logic will go here
        this.trackRouteChanges();
        this.trackButtonInteractions();
    }

    /**
     * Tracks changes in the URL (route changes).
     */
    trackRouteChanges() {
        // Route change tracking logic will be added here
        console.log('Setting up route change tracking...');
        this.currentPath = this.getCurrentPath(); // Store initial path

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const newPath = this.getCurrentPath();
            this.reportRouteChange(this.currentPath, newPath);
            this.currentPath = newPath;
        });

        // Listen for history API changes (pushState/replaceState need custom handling)
        window.addEventListener('popstate', () => {
            const newPath = this.getCurrentPath();
            this.reportRouteChange(this.currentPath, newPath);
            this.currentPath = newPath;
        });

        // Note: pushState and replaceState don't fire events automatically.
        // Robust SPA tracking often requires patching these methods or using framework-specific hooks.
        // For this simple example, hashchange and popstate cover basic cases.
        console.log('Route change tracking setup complete.');
    }

    /**
     * Helper function to get the current path (hash or pathname).
     */
    getCurrentPath() {
        return window.location.hash || window.location.pathname;
    }

    /**
     * Reports a route change event.
     * @param {string} oldPath - The previous path.
     * @param {string} newPath - The new path.
     */
    reportRouteChange(oldPath, newPath) {
        if (oldPath !== newPath) {
            this.reportEvent('RouteChange', {
                from: oldPath,
                to: newPath,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Tracks clicks on button elements.
     */
    trackButtonInteractions() {
        // Button interaction tracking logic will be added here
        console.log('Setting up button interaction tracking...');

        // Use event delegation on the document
        document.addEventListener('click', (event) => {
            // Find the closest button element (if any)
            const buttonElement = event.target.closest('button');

            if (buttonElement) {
                const buttonId = buttonElement.id;
                const buttonText = buttonElement.textContent || buttonElement.innerText;
                const buttonClass = buttonElement.className;

                this.reportEvent('ButtonClicked', {
                    elementId: buttonId,
                    elementType: 'button',
                    elementText: buttonText.trim(),
                    elementClasses: buttonClass,
                    timestamp: Date.now()
                });
            }
        });
        console.log('Button interaction tracking setup complete.');
    }

    /**
     * Reports an arbitrary event.
     * @param {string} eventName - The name of the event.
     * @param {object} eventData - Additional data associated with the event.
     */
    reportEvent(eventName, eventData = {}) {
        // Arbitrary event reporting logic will be added here
        // console.log(`Reporting event: ${eventName}`, eventData); // Keep for debugging if needed
        const payload = {
            event: eventName,
            properties: eventData,
            url: window.location.href,
            timestamp: Date.now(), // Ensure timestamp is always present
            // Potentially add more common context here: user agent, screen size, etc.
        };

        this.sendData(payload);
    }

    /**
     * Sends the tracked data to a backend (placeholder).
     * @param {object} data - The data to send.
     */
    sendData(data) {
        // console.log('Sending data:', data); // Replaced by debug log
        // In a real implementation, this would send data to an API endpoint.
        // Example: fetch(this.config.endpoint, { method: 'POST', body: JSON.stringify(data) });
        if (this.config.debug) {
            console.log('[InsightsClient DEBUG] Sending data:', data);
        }

        if (this.config.targetApi) {
            fetch(this.config.targetApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any other headers needed, like API keys
                },
                body: JSON.stringify(data),
                // Use keepalive for requests potentially happening during page unload
                keepalive: true
            })
            .then(response => {
                if (!response.ok) {
                    // Log error details if response is not OK
                    response.text().then(text => {
                        console.error(`[InsightsClient] Failed to send data to ${this.config.targetApi}. Status: ${response.status}. Body: ${text}`);
                    });
                } else if (this.config.debug) {
                     console.log(`[InsightsClient DEBUG] Data successfully sent to ${this.config.targetApi}`);
                }
            })
            .catch(error => {
                console.error(`[InsightsClient] Error sending data to ${this.config.targetApi}:`, error);
            });
        } else if (this.config.debug) {
            console.warn('[InsightsClient DEBUG] No targetApi configured. Data not sent.');
        }
    }
}

export default InsightsClient;
