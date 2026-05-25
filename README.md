# 🚀 AI Autoflow - Multi-Channel Business Automation Platform

AI Autoflow is a production-grade, multi-tenant enterprise SaaS platform designed to centralize and automate customer communication across multiple channels (WhatsApp, Webhooks, SMS, and Voice Calls). By integrating a visual workflow automation builder, real-time CRM Kanban boards, and a Google Gemini 2.0 powered RAG (Retrieval-Augmented Generation) agent, AI Autoflow enables startups and enterprises to capture, score, and close deals instantly.

---

## 📌 1. The Problem Statement

Modern businesses face a fragmented communication landscape:
* **Siloed Channels**: Customer inquiries are scattered across WhatsApp, Email, Telegram, and SMS. Keeping track of customer conversations across these disjointed platforms is tedious and inefficient.
* **Delayed Response Times**: Leads go cold rapidly. Manually drafting replies and waiting for sales representatives to follow up leads to extremely low conversion rates.
* **Manual Data Processing**: Updating CRM databases, qualifying leads, extracting emails/phone numbers, and setting calendar reminders are currently done manually, which is highly prone to human error.
* **Rigid AI Chatbots**: Traditional chatbots rely on static decision-trees and cannot dynamically adapt, query complex context fact-sheets, or escalate calls to human agents smoothly.

---

## 💡 2. The Proposed Solution

**AI Autoflow** acts as an intelligent, unified digital operating system for businesses:
* **Unified Inbox**: Consolidates real-time feeds from WhatsApp, Instagram, Webchat, and Voice into a single, high-fidelity conversational console.
* **Visual Workflow Engine**: A drag-and-drop scripting system that evaluates automation rules on incoming triggers (like `message_received` or `lead_created`), updating lead stages and firing templates automatically.
* **Gemini 2.0 RAG Agent**: An advanced conversational assistant powered by Google Gemini 2.0. It retrieves relevant, semantic context blocks (Fact Sheets) from an embedded vector database using cosine similarity to answer highly technical FAQ queries.
* **Active Contact Capture**: Automatically extracts email addresses, schedules appointment reminders, updates CRM Kanban stages, and calculates dynamic "Deal Scores" in real-time.
* **Voice-to-Text Call Center**: Features full Twilio Voice speech gather integrations, turning telephone calls into real-time transcriptions that feed directly into our AI RAG pipeline for voice-synthesized AI responses.

---

## 🏗️ 3. System Architecture

```text
                                     +-----------------------------------------+
                                     |            CUSTOMER TOUCHPOINTS         |
                                     +-----------------------------------------+
                                          |                                |
                                          v                                v
                                    [WhatsApp App]                  [Phone (Voice Call)]
                                          |                                |
                                          v                                v
                                     +-----------------------------------------+
                                     |             TWILIO CLOUD                |
                                     +-----------------------------------------+
                                                          |
                                            POST Webhook  |  HTTP XML (TwiML)
                                                          v
                                     +-----------------------------------------+
                                     |     AI AUTOFLOW BACKEND (Node/Express)  | <---+
                                     +-----------------------------------------+     |
                                          |                   |         |            |
                                          v                   v         |            | Socket.IO
                                 +----------------+   +-----------+     |            | (Real-Time)
                                 | GOOGLE GEMINI  |   |  MONGODB  |     |            |
                                 |  (2.0 Flash /  |   |  (Atlas/  |     v            |
                                 |  Embeddings)   |   |   Local)  |   +--------------------------+
                                 +----------------+   +-----------+   | FRONTEND CLIENT (NextJS) |
                                                                      +--------------------------+
```

---

## 🛠️ 4. Tech Stack Explanation

### 💻 Frontend (Next.js & React)
* **Framework**: `Next.js 14` utilizing React's state management for smooth single-page interfaces.
* **Styling**: `TailwindCSS` with high-premium dark modes, neon gradients, glassmorphism panel styles, and micro-animations.
* **Real-time Communication**: `Socket.io-client` listening to instant message dispatches, conversation updates, and lead status adjustments.
* **Analytics Visualization**: `Recharts` providing responsive visual analytics plotting lead volumes, channel velocities, and stage metrics.
* **Icons**: `Lucide-React` for clean visual UI identifiers.

### 🖥️ Backend (Node.js & Express)
* **Runtime & Framework**: `Node.js` + `Express` providing a robust REST API framework and Socket.IO server.
* **Database ODM**: `Mongoose` / `MongoDB` storing leads, message feeds, analytics collections, fact-sheet vector chunks, and workspace configurations.
* **Security & Logger**: `Helmet` protecting headers and `Morgan` recording console HTTP request diagnostics.

### 🤖 Generative AI Engine (Google Gemini RAG)
* **Conversational Model**: `Gemini-2.0-Flash` via the `@google/generative-ai` SDK, offering fast inference times and robust system instructions.
* **Semantic Vector Embeddings**: `gemini-embedding-001` translating questions and fact-sheet text into 768-dimensional float arrays.
* **Semantic Context Matcher**: A high-speed cosine similarity algorithm that calculates vector distances to retrieve matching fact blocks, injecting them directly into Gemini's system instructions.
* **Fail-Safe Fallback**: An intelligent local rule-engine that guarantees a friendly, contextual response even if external API limits (e.g. rate limit `429`) are exceeded.

---

## ✨ 5. Key Features

1. **Intelligent Lead CRM Pipelines**: A visual drag-and-drop Kanban Board displaying leads categorized by stages (`new`, `qualified`, `contacted`, `won`, `lost`).
2. **Automated Reminders & Scheduling**: If a customer mentions scheduling a consultation (e.g., *"tomorrow at 3 PM"*), the server extracts the date, auto-provisions a calendar reminder, and notes it under the lead's note feed.
3. **Interactive Workspace Settings**: Reprovision your business context name dynamically to reflect different workspace brands.
4. **Sandbox Simulator Panel**: A complete virtual testing ground to simulate inbound WhatsApp messages, reset testing logs, and check webhook responses.

---

## 🚀 6. Local Quickstart

### Prerequisites
* **Node.js**: v18+
* **MongoDB**: A running local instance or a MongoDB Atlas URI string.

### Clone and Configure
1. Clone the repository and navigate to the project directory.
2. In `backend/.env` add:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=secure_jwt_random_string
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. In `frontend/.env.local` add:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### Launch Development Stack
1. **Launch Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Launch Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` to access the console panel.
