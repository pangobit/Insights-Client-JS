class InsightsClient {
    constructor(config = {}) {
        const defaultConfig = {
            targetApi: null,
            debug: false
        };
        this.config = { ...defaultConfig, ...config };

        if (!this.config.targetApi) {
            console.warn('InsightsClient: targetApi not provided in config. Data will only be logged to console.');
        }

        this.initialize();
    }

    initialize() {
        if (this.config.debug) {
            console.log('InsightsClient Initialized');
        }
        this.trackRouteChanges();
        this.trackButtonInteractions();
    }

    /**
     * Tracks changes in the URL (route changes).
     */
    trackRouteChanges() {
        if (this.config.debug) {
            console.log('Setting up route change tracking...');
        }
        this.currentPath = this.getCurrentPath();

        window.addEventListener('hashchange', () => {
            const newPath = this.getCurrentPath();
            this.reportRouteChange(this.currentPath, newPath);
            this.currentPath = newPath;
        });

        window.addEventListener('popstate', () => {
            const newPath = this.getCurrentPath();
            this.reportRouteChange(this.currentPath, newPath);
            this.currentPath = newPath;
        });

        if (this.config.debug) {
            console.log('Route change tracking setup complete.');
        }
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
        if (this.config.debug) {
            console.log('Setting up button interaction tracking...');
        }

        document.addEventListener('click', (event) => {
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

        if (this.config.debug) {
            console.log('Button interaction tracking setup complete.');
        }
    }

    /**
     * Reports an arbitrary event.
     * @param {string} eventName - The name of the event.
     * @param {object} eventData - Additional data associated with the event.
     */
    reportEvent(eventName, eventData = {}) {
        const payload = {
            event: eventName,
            properties: eventData,
            url: window.location.href,
            timestamp: Date.now(),
        };

        this.sendData(payload);
    }

    /**
     * Sends the tracked data to a backend (placeholder).
     * @param {object} data - The data to send.
     */
    sendData(data) {
        if (this.config.debug) {
            console.log('[InsightsClient DEBUG] Sending data:', data);
        }

        if (this.config.targetApi) {
            fetch(this.config.targetApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                keepalive: true
            })
            .then(response => {
                if (!response.ok) {
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
