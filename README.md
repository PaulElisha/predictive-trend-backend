<!-- @format -->

# Stock Predictions AI

A powerful full-stack application that leverages Artificial Intelligence to analyze stock market data and generate performance reports. This project uses a microservices-inspired architecture with an Express.js backend and Cloudflare Workers for efficient data fetching and AI processing.

Production API:
- Base URL: https://predictive-trend-api.onrender.com

Public route prefix:
- All API routes are mounted under /api

Quick example:
- Health/Root: GET https://predictive-trend-api.onrender.com/api

## 🚀 Features

- **Stock Data Retrieval**: Fetches real-time/historical stock data using Polygon.io (via a dedicated Cloudflare Worker).
- **AI Analysis**: Generates insightful stock performance reports using OpenAI/Mistral AI (via a dedicated Cloudflare Worker).
- **Microservices Architecture**: Decoupled services for better scalability and maintainability.
- **TypeScript**: Fully typed codebase for reliability and developer experience.
- **MongoDB**: Persistent storage for application data (configured).

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **database**: MongoDB (Mongoose)
- **Serverless Workers**: Cloudflare Workers
- **AI Integration**: @mistralai/mistralai (and OpenAI support)
- **Data Provider**: Polygon.io
- **HTTP Client**: Axios

## 📋 Prerequisites

Ensure you have the following installed:

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)
- MongoDB (Local instance or Atlas connection string)
- Cloudflare Wrangler CLI (for running workers)

## ⚙️ Configuration

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/PaulElisha/stock-predictions-ai.git
    cd stock-predictions-ai
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory by copying `.env.example` (or using the keys below) and filling in your credentials:

    ```env
    # Server Configuration
    PORT=8000
    HOST_NAME=http://localhost

    # Database
    MONGODB_URI=mongodb://localhost:27017/stock-predictions

    # API Keys
    OPENAI_API_KEY=your_openai_api_key
    POLYGON_API_KEY=your_polygon_api_key
    MISTRAL_AI_API_KEY=your_mistral_api_key

    # External Services
    POLYGON_BASE_URL=https://api.polygon.io
    MISTRAL_SERVER_URL=https://api.mistral.ai

    # Worker URLs (Local dev URLs or deployed Cloudflare URLs)
    OPENAI_WORKER_URL=http://localhost:8787 # Example
    POLYGON_WORKER_URL=http://localhost:8788 # Example
    ```

## 📦 Installation & Running

## 🌐 Deployed API & Usage

Base URL
- https://stock-predictions-ai.vercel.app/
- All endpoints are under the /api route

Endpoints
- GET /api
  - Description: Basic health/root endpoint of the API. Useful to verify deployment.
  - cURL:
    ```bash
    curl -i https://stock-predictions-ai.vercel.app/api
    ```

- POST /api/stock-prediction
  - Description: Generate a stock performance report with AI based on parameters.
  - Request Body (JSON):
    ```json
    {
      "ticker": ["AAPL", "MSFT"],
      "dates": {
        "startDate": "2024-12-01",
        "endDate": "2024-12-15"
      }
    }
    ```
    - ticker: Array of stock ticker symbols (string[]; at least one required)
    - dates.startDate: Start date in YYYY-MM-DD (string)
    - dates.endDate: End date in YYYY-MM-DD (string)
  - cURL example:
    ```bash
    curl -i \
      -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "ticker": ["AAPL", "MSFT"],
        "dates": {
          "startDate": "2024-12-01",
          "endDate": "2024-12-15"
        }
      }' \
      https://stock-predictions-ai.vercel.app/api/stock-prediction
    ```
  - Notes:
    - The backend orchestrates calls to Polygon and AI Workers. If those workers are not available or environment variables are not configured, this endpoint may return an error.

- Example Response
  - A successful response generally includes a generated summary/analysis and possibly structured metrics. The exact schema may evolve; an example shape:
    ```json
    {
      "ticker": ["AAPL", "MSFT"],
      "dates": { "startDate": "2024-12-01", "endDate": "2024-12-15" },
      "analysis": "AI-generated performance summary...",
      "data": { "ohlc": [/* ... */] }
    }
    ```

Common cURL tips
- Add -s for silent, -S to show errors, and -w "\n" to append newline to output.
- For JSON pretty-printing locally: pipe to jq, e.g., ... | jq .

### 1. Backend Server

Install dependencies and start the Express server:

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build and run
npm run build
npm start
```

### 2. Cloudflare Workers

The project contains two workers in `src/workers`. You need to run them separately (or deploy them) for the application to function fully.

**OpenAI Worker:**

```bash
cd src/workers/openai-worker
npm install
npm run dev
```

**Polygon Worker:**

```bash
cd src/workers/polygon-worker
npm install
npm run dev
```

> **Note:** Make sure the `OPENAI_WORKER_URL` and `POLYGON_WORKER_URL` in your root `.env` match the URLs where your workers are running (usually printed in the terminal by Wrangler).

## 📐 Architecture Overview

The application follows a clean separation of concerns with a streaming-first approach:

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Express Backend
    participant PW as Polygon Worker
    participant OW as OpenAI Worker
    participant M as Mistral/OpenAI API

    F->>B: POST /api/stock-prediction
    Note over B: Initializing SSE Stream
    B-->>F: HTTP 200 (text/event-stream)
    
    rect rgb(240, 240, 240)
    Note right of B: Step 1: Data Retrieval (Pull)
    B->>PW: GET /ticker-data
    PW-->>B: JSON (Historical OHLC)
    end

    rect rgb(230, 245, 255)
    Note right of B: Step 2: AI Analysis (Push/Stream)
    B->>OW: POST /analyze (Stream Request)
    OW->>M: Start Chat Stream
    
    loop Token Streaming
        M-->>OW: Token Chunks
        OW-->>B: SSE Chunks (data: "...")
        B-->>F: SSE Chunks (Passthrough)
    end
    
    M-->>OW: Stream Done
    OW-->>B: Stream Done
    B-->>F: Connection Closed
    end
```

1.  **Controller (`src/controllers`)**: Handles incoming HTTP requests. For stock predictions, it immediately sets Server-Sent Events (SSE) headers to allow real-time token streaming to the frontend.
2.  **Service (`src/services`)**: Orchestrates the multi-step process:
    - **Data Pull**: Fetches structured stock data from the **Polygon Worker**.
    - **Stream Passthrough**: Proxies the AI generation stream from the OpenAI Worker directly to the controller's response pipe.
3.  **Workers (`src/workers`)**:
    - `polygon-worker`: Proxies requests to Polygon.io, handling authentication and formatting.
    - `openai-worker`: Interfaces with Mistral/OpenAI. It transforms the AI's native stream into standard SSE format (`data: "..."`) for the backend to consume.

### 🛡️ Robust Reliability & Streaming Resiliency
The architecture includes highly durable enhancements to ensure robust network and token management:
- **"Leak-Proof" Abort Propagation**: Utilizing native `AbortController`, any frontend connection drops (e.g., a user closing their browser tab or unmounting a component) instantly propagate down through Express and Axios all the way to the Cloudflare Worker. This natively halts AI generation models mid-stream to conserve API compute costs.
- **Microservice Retries (`axios-retry`)**: Inter-service communication with the Polygon Worker handles exponential backoffs entirely automatically. If API fetching stutters, the system retries 3 times under a strict 5-second HTTP timeout window.
- **Cancelable Async Flows (`caf`)**: Mistral event streaming operates over an Async Generator securely bound inside a `CAF()` wrapper. If Stream Yields fail, it implements `async-retry` internally, securely failing or safely tearing down without streaming broken payloads to the client. 
- **Backpressure Memory Buffering**: Native Web Streams implement backpressure via checking `controller.desiredSize <= 0` prior to token enqueueing. This proactively micro-blocks Cloudflare Worker runaway loops if the Express backend or Client connection buffers become full, completely eliminating server RAM bloat/overflows.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License.
