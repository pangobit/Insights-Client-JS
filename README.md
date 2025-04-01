# Insights Client JS

A simple JavaScript client for tracking user interactions on web pages.

## Features

- Track route changes
- Track button clicks
- Report arbitrary events

## Installation

```bash
# Installation instructions will go here (e.g., npm install insights-client-js)
```

## Usage

```javascript
import InsightsClient from 'insights-client-js'; // Or adjust path based on installation

const insights = new InsightsClient({
  targetApi: '/your/api/endpoint', // Required: Your data collection endpoint
  debug: false // Optional: Set to true for console logs
});

// Tracking happens automatically for route changes and button clicks.

// Manually report a custom event:
insights.reportEvent('VideoPlayed', { videoId: 'xyz789', duration: 120 });
```

## Example

To run the included example application:

1.  Clone the repository.
2.  Navigate to the project directory.
3.  Run the example server:
    ```bash
    npm run start:example
    ```
4.  This will open `examples/index.html` in your browser, served locally.

## Testing

Tests are written using Deno.

### Running Tests with Docker (Recommended)

This method avoids needing to install Deno locally.

1. Ensure Docker is installed and running.
2. Navigate to the project root directory.
3. Run the following command:

```bash
docker run --rm -it -v $(pwd):/app -w /app denoland/deno:latest deno test --allow-read --allow-env --allow-net
```

### Running Tests with Local Deno Installation

1. Install Deno ([https://deno.land/](https://deno.land/)).
2. Navigate to the project root directory.
3. Run the following command:

```bash
deno test --allow-read --allow-env --allow-net
```
