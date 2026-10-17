<div align="center">
  <h1>ARI - Accounts Receivable Intelligence</h1>
  <p><strong>AI-Powered Early Warning System for B2B Receivables</strong></p>
  
  [![AI Builder Cup](https://img.shields.io/badge/AI%20Builder%20Cup-2026-blue?style=for-the-badge&logo=google-cloud)](https://aibuildercup.withgoogle.com/)
  [![Google Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
  [![Firebase](https://img.shields.io/badge/Hosted%20on-Firebase-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  
  [Live Demo](https://ar-overdue.web.app) · [Business Requirements Document](link-to-brd)
</div>

---

## 📖 Overview

B2B companies (especially in truck rental, leasing, and logistics) often face a critical issue: **they only realize a customer is a bad payer after the invoice is overdue.** Traditional credit assessments are done at contract signing, but financial conditions change rapidly.

**ARI (Accounts Receivable Intelligence)** solves this by acting as a proactive early-warning system. It monitors internal payment behaviors and combines them with external public intelligence (legal records, financial news) using **Gemini AI** to generate risk alerts *before* the invoice hits the due date.

### Why We Built This (Beyond the Competition)
- **For CFOs & Collection Teams:** Reduces Days Sales Outstanding (DSO) and minimizes bad debt write-offs.
- **For Credit Analysts:** Shifts the workflow from *reactive* (chasing overdue payments) to *proactive* (preventing overdue payments).
- **Human-in-the-Loop:** Gemini acts as an advisor, suggesting collection strategies and summarizing external news, but final contractual actions (like contract termination or repossession) require explicit human approval.

---

## 🛠️ Tech Stack & Reasons

| Technology | Role | Why We Chose It |
|------------|------|-----------------|
| **Vanilla JS & HTML** | Frontend UI | Ultra-lightweight, zero build steps, ensures fast loading times and easy deployment. |
| **SQLite (sql.js) + LocalStorage** | Database | Runs entirely in the browser. Perfect for a serverless prototype. Persists data across refreshes without needing a backend database, keeping costs at $0. |
| **Google Gemini 2.0 Flash** | AI Engine | Extremely fast, cost-efficient, and capable of parsing unstructured web data into structured risk evidence. |
| **Cloudflare Workers** | API Proxy & Scraper | Secures the Gemini API key (never exposed to the client). Acts as a serverless backend for web scraping external data. Free tier is generous. |
| **Firebase Hosting** | Deployment | Global CDN, SSL out of the box, and integrates seamlessly with Google Cloud ecosystem. |
| **ApexCharts & DataTables** | UI Components | Provides smooth, responsive, and interactive data visualizations and large dataset management. |

---

## 🏗️ Architecture

```mermaid
graph TD
    A[Browser SPA] -->|Queries| B[(SQLite / LocalStorage)]
    A -->|Requests AI / Scrape| C[Cloudflare Worker]
    C -->|Secures API Key| C
    C -->|Prompt + Grounding| D[Google Gemini API]
    C -->|Fetch External Data| E[Public News / Legal SIPP / IDX]
    D -->|Analysis| C
    C -->|Returns Structured Evidence| A