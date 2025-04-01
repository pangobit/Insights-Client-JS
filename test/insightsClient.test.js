import { assert, assertEquals, assertExists, assertObjectMatch } from "jsr:@std/assert";
import InsightsClient from "../src/insightsClient.js";

// --- Mock Browser Globals (Enhanced) ---
let mockWindowListeners = {};
let mockDocumentListeners = {};
let lastFetchCall = null;
let mockLocation = {};

function resetMocks() {
    mockWindowListeners = {};
    mockDocumentListeners = {};
    lastFetchCall = null;
    mockLocation = {
        href: 'http://localhost/test',
        hash: '',
        pathname: '/test'
    };

    globalThis.window = {
        location: mockLocation,
        addEventListener: (type, listener) => {
            if (!mockWindowListeners[type]) mockWindowListeners[type] = [];
            mockWindowListeners[type].push(listener);
        },
        removeEventListener: (type, listener) => {
            // Basic removal, might need more robust implementation if needed
            if (mockWindowListeners[type]) {
                mockWindowListeners[type] = mockWindowListeners[type].filter(l => l !== listener);
            }
        },
        // Simulate dispatching an event
        dispatchEvent: (event) => {
            if (mockWindowListeners[event.type]) {
                mockWindowListeners[event.type].forEach(listener => listener(event));
            }
        }
    };

    globalThis.document = {
         // Simulate document click listener for button tracking
        addEventListener: (type, listener) => {
             if (!mockDocumentListeners[type]) mockDocumentListeners[type] = [];
             mockDocumentListeners[type].push(listener);
        },
        removeEventListener: (type, listener) => {
             if (mockDocumentListeners[type]) {
                 mockDocumentListeners[type] = mockDocumentListeners[type].filter(l => l !== listener);
             }
        },
        // Simulate dispatching an event on document
         dispatchEvent: (event) => {
             if (mockDocumentListeners[event.type]) {
                 mockDocumentListeners[event.type].forEach(listener => listener(event));
             }
         },
        getElementById: (id) => ({ // Basic mock element
            id: id,
            innerHTML: '',
            addEventListener: () => {},
            removeEventListener: () => {}
        }),
         // Provide body for event listener attachment if needed by client logic
         body: {
             addEventListener: (type, listener) => document.addEventListener(type, listener), // Delegate to document mock
             removeEventListener: (type, listener) => document.removeEventListener(type, listener)
         }
    };

    globalThis.fetch = async (url, options) => {
        lastFetchCall = { url: url.toString(), options: options, body: JSON.parse(options.body) };
        // console.log(`Mock fetch called: ${url}`, options);
        return new Response("OK", { status: 200 });
    };
}

// Helper to simulate events
function simulateEvent(target, type, eventData = {}) {
    const event = { type, target, ...eventData, stopPropagation: () => {}, preventDefault: () => {} };
    target.dispatchEvent(event);
}

// Helper to create mock DOM elements
function createMockElement(tagName, properties = {}) {
    let element = {
        tagName: tagName.toUpperCase(),
        id: properties.id || '',
        className: properties.className || '',
        textContent: properties.textContent || '',
        // Mock closest for button tracking
        closest: function(selector) {
            if (selector === 'button' && this.tagName === 'BUTTON') {
                return this;
            }
            // Add more complex logic if nested structures are needed
            return null;
        }
    };
    // Simulate dispatching directly on element if needed (though delegation uses document)
    element.dispatchEvent = (event) => {
         if (mockDocumentListeners[event.type]) {
             mockDocumentListeners[event.type].forEach(listener => listener(event));
         }
     };
    return element;
}


// --- Test Suite ---

Deno.test("InsightsClient - Initialization", () => {
    resetMocks();
    const client = new InsightsClient({
        targetApi: '/api/test-endpoint',
        debug: false // Set debug false to avoid extra console noise in tests
    });

    assertExists(client, "Client instance should be created");
    assertEquals(client.config.targetApi, '/api/test-endpoint');
    assertExists(client.currentPath, "currentPath should be initialized");
    assertEquals(client.currentPath, '/test', "Initial path should be set from mockLocation");
});

Deno.test("InsightsClient - Route Change Tracking (hashchange)", () => {
    resetMocks();
    const client = new InsightsClient({ targetApi: '/api/track' });

    // Simulate hash change
    mockLocation.hash = '#new-route';
    mockLocation.href = 'http://localhost/test#new-route'; // Update href too
    simulateEvent(window, 'hashchange'); // Dispatch the event

    assertExists(lastFetchCall, "fetch should have been called on hashchange");
    assertEquals(lastFetchCall.url, '/api/track');
    assertObjectMatch(lastFetchCall.body, {
        event: "RouteChange",
        properties: {
            from: "/test", // Initial path
            to: "#new-route", // New path from hash
        }
    }, "RouteChange event data should be correct");
    assertEquals(client.currentPath, "#new-route", "Client's currentPath should be updated");
});

// Note: Testing popstate requires more complex history mocking, omitted for simplicity here.

Deno.test("InsightsClient - Button Click Tracking", () => {
    resetMocks();
    const client = new InsightsClient({ targetApi: '/api/track' });

    // Simulate button click
    const mockButton = createMockElement('button', { id: 'testBtn', className: 'btn primary', textContent: ' Click Me ' });
    // Simulate the event bubbling up to the document
    simulateEvent(document, 'click', { target: mockButton });

    assertExists(lastFetchCall, "fetch should have been called on button click");
    assertEquals(lastFetchCall.url, '/api/track');
    assertObjectMatch(lastFetchCall.body, {
        event: "ButtonClicked",
        properties: {
            elementType: "button",
            elementId: "testBtn",
            elementClasses: "btn primary",
            elementText: "Click Me", // Should be trimmed
        }
    }, "ButtonClicked event data should be correct");
});


Deno.test("InsightsClient - reportEvent Functionality", () => {
    resetMocks();
    const client = new InsightsClient({ targetApi: '/api/track' });
    const customData = { userId: 123, value: 'example' };

    client.reportEvent("CustomAction", customData);

    assertExists(lastFetchCall, "fetch should have been called by reportEvent");
    assertEquals(lastFetchCall.url, '/api/track');
    assertObjectMatch(lastFetchCall.body, {
        event: "CustomAction",
        properties: customData,
        url: 'http://localhost/test' // From mockLocation.href
    }, "Custom event data should be correct");
    // Check if timestamp exists (it's generated internally)
    assertExists(lastFetchCall.body.timestamp, "Timestamp should exist in payload");
});


Deno.test("InsightsClient - No fetch if targetApi is null", () => {
    resetMocks();
     // No targetApi provided
    const client = new InsightsClient({ debug: false });

    client.reportEvent("ShouldNotSend", { data: 1 });

    assertEquals(lastFetchCall, null, "fetch should not be called when targetApi is null");
});

Deno.test("InsightsClient - Initialization Warning if targetApi is null", () => {
    resetMocks();
    let warned = false;
    const originalWarn = console.warn; // Store original console.warn
    console.warn = (...args) => { // Temporarily override
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('InsightsClient: targetApi not provided')) {
            warned = true;
        }
        originalWarn.apply(console, args); // Call original afterwards if needed
    };

    new InsightsClient({ debug: true }); // Instantiate without targetApi

    console.warn = originalWarn; // Restore original
    assert(warned, "Should have logged a warning when targetApi is missing");
});

// Add more tests here for:
// - popstate (requires more advanced history mocking)
// - Error handling in fetch (mocking fetch to reject or return non-ok status)
// - Configuration options (e.g., different debug levels if added)

// Add more tests here for:
// - Route change tracking (mocking hashchange/popstate)
// - Button click tracking (mocking clicks)
// - reportEvent functionality
// - sendData (checking if fetch is called correctly) 