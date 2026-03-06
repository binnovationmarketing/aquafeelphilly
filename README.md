<div align="center">

# 💧 Aquafeel VIP Proposal

**An intelligent, interactive sales proposal platform for Aquafeel — a premium water purification solution for the Philadelphia market.**

[![CI](https://github.com/your-org/aquafeel-vip-proposal/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/aquafeel-vip-proposal/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Overview

Aquafeel VIP Proposal is a full-featured, React-based web application that delivers an immersive, guided sales experience for water purification systems. It features:

- 🎯 **Guided presentation flow** – Step-by-step interactive proposal slides
- 💰 **Smart financing calculator** – Real-time monthly payment estimates based on credit score ranges
- 🤖 **AI-powered Q&A** – Google Gemini AI-backed FAQ and assistant
- 👤 **Multi-role dashboard** – Separate views for clients, analysts, and managers
- 📊 **Analytics & reporting** – Manager metrics and client intake tracking
- 🌐 **i18n ready** – Full internationalization support
- 🔐 **Supabase backend** – Authentication and persistent data storage

---

## 🛠️ Tech Stack

| Category         | Technology                                      |
|------------------|-------------------------------------------------|
| **Framework**    | React 18 + TypeScript 5                         |
| **Build Tool**   | Vite 5                                          |
| **Styling**      | Tailwind CSS 3                                  |
| **Animation**    | Framer Motion 12                                |
| **Backend**      | Supabase (PostgreSQL + Auth)                    |
| **AI**           | Google Generative AI (Gemini)                   |
| **Charts**       | Recharts                                        |
| **Icons**        | Lucide React                                    |
| **Testing**      | Vitest + Testing Library                        |
| **Linting**      | ESLint (flat config) + Prettier                 |
| **CI/CD**        | GitHub Actions                                  |
| **Deps Updates** | Renovate                                        |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v10+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/aquafeel-vip-proposal.git
cd aquafeel-vip-proposal

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in your values (see below)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

Create a `.env` file at the project root (copy from `.env.example`):

| Variable                 | Required | Description                          |
|--------------------------|----------|--------------------------------------|
| `VITE_SUPABASE_URL`      | ✅       | Your Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY` | ✅       | Your Supabase anonymous/public key   |
| `VITE_GEMINI_API_KEY`    | ✅       | Google Gemini AI API key             |

> ⚠️ **Never commit `.env` files.** They are listed in `.gitignore`.

---

## 📜 Available Scripts

| Script                   | Description                                   |
|--------------------------|-----------------------------------------------|
| `npm run dev`            | Start local development server (HMR)          |
| `npm run build`          | Type-check + production build                 |
| `npm run preview`        | Preview production build locally              |
| `npm run lint`           | Run ESLint on all `.ts` / `.tsx` files        |
| `npm run lint:fix`       | ESLint with auto-fix                          |
| `npm run format`         | Format all files with Prettier                |
| `npm run format:check`   | Check formatting without writing changes      |
| `npm run type-check`     | TypeScript type-check (no emit)               |
| `npm run test`           | Run all tests once                            |
| `npm run test:watch`     | Run tests in watch mode                       |
| `npm run test:coverage`  | Run tests and generate coverage report        |

---

## 📁 Project Structure

```
aquafeel-vip-proposal/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI: lint, test, build
├── __tests__/
│   ├── components/             # Component tests
│   └── utils/                  # Utility unit tests
├── components/                 # React components
│   ├── Auth/                   # Authentication screens
│   ├── ui/                     # Reusable UI primitives
│   └── *.tsx                   # Feature components
├── contexts/                   # React contexts (global state)
├── lib/                        # Supabase client setup
├── src/
│   └── test/
│       └── setup.ts            # Vitest setup (jest-dom)
├── utils/
│   ├── assets.ts               # Asset constants
│   ├── clientStore.ts          # Client data persistence
│   ├── financials.ts           # Pricing / installment logic
│   └── i18n.ts                 # Translations
├── .editorconfig               # Editor consistency rules
├── .env.example                # Environment variable template
├── .prettierrc                 # Prettier config
├── eslint.config.js            # ESLint flat config
├── renovate.json               # Renovate dependency bot
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── vitest.config.ts            # Vitest test config
├── CONTRIBUTING.md             # Contribution guidelines
└── README.md                   # This file
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage report (saved to ./coverage/)
npm run test:coverage
```

Tests are located in `__tests__/` and follow the pattern `*.test.ts` / `*.test.tsx`.

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit guidelines, and the PR process.

---

## 📄 License

This project is proprietary software owned by **Aquafeel Solutions Philly**. All rights reserved.
