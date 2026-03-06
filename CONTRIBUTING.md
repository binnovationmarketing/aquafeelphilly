# Contributing to Aquafeel VIP Proposal

Thank you for your interest in contributing! This document outlines the process for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

---

## Code of Conduct

Be respectful, constructive, and collaborative. Harassment or exclusionary behavior of any kind will not be tolerated.

---

## Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **npm** v10 or higher

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/aquafeel-vip-proposal.git
cd aquafeel-vip-proposal

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in the values in .env

# 4. Start the dev server
npm run dev
```

---

## Development Workflow

### Branch Naming

| Type        | Pattern                        | Example                          |
|-------------|--------------------------------|----------------------------------|
| Feature     | `feature/<short-description>`  | `feature/add-payment-modal`      |
| Bug fix     | `fix/<short-description>`      | `fix/login-redirect-loop`        |
| Chore/Deps  | `chore/<short-description>`    | `chore/update-dependencies`      |
| Documentation | `docs/<short-description>`   | `docs/improve-readme`            |

### Available Scripts

| Script              | Description                          |
|---------------------|--------------------------------------|
| `npm run dev`       | Start development server             |
| `npm run build`     | Production build                     |
| `npm run preview`   | Preview production build locally     |
| `npm run lint`      | Run ESLint                           |
| `npm run lint:fix`  | Run ESLint and auto-fix issues       |
| `npm run format`    | Format all files with Prettier       |
| `npm run type-check`| TypeScript type check (no emit)      |
| `npm run test`      | Run tests with Vitest                |
| `npm run test:coverage` | Run tests with coverage report   |

---

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to use                                      |
|------------|--------------------------------------------------|
| `feat`     | A new feature                                    |
| `fix`      | A bug fix                                        |
| `docs`     | Documentation changes only                       |
| `style`    | Formatting, missing semicolons, etc. (no logic)  |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                         |
| `chore`    | Maintenance tasks (deps, config, CI)             |
| `perf`     | Performance improvement                          |

### Examples

```
feat(calculator): add 240-month financing option
fix(auth): resolve redirect loop after login
docs(readme): add environment variable reference
chore(deps): update framer-motion to v12.24
```

---

## Pull Request Process

1. **Fork** the repository and create your branch from `main`.
2. **Implement** your changes, following the code style guidelines below.
3. **Test** your changes: `npm run test`
4. **Lint**: `npm run lint`
5. **Ensure the build passes**: `npm run build`
6. **Open a Pull Request** targeting the `main` branch.
7. Fill out the PR template — describe what changed and why.
8. At least **one reviewer** must approve before merging.
9. PRs are **squash-merged** to keep history clean.

---

## Code Style

This project uses **ESLint** and **Prettier** to enforce consistent code style. Configuration lives in `eslint.config.js` and `.prettierrc`.

- Run `npm run format` before committing to auto-format your code.
- Run `npm run lint:fix` to auto-fix lint issues.
- TypeScript strict mode is enabled — avoid using `any`.
- Components use **named exports** (no default exports for components).
- Keep components focused: extract logic to custom hooks or utilities when a component exceeds ~150 lines.

---

## Environment Variables

See `.env.example` for required variables. Never commit `.env` files with real secrets.

| Variable                 | Description                        |
|--------------------------|------------------------------------|
| `VITE_SUPABASE_URL`      | Your Supabase project URL          |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key        |
| `VITE_GEMINI_API_KEY`    | Google Gemini AI API key           |

---

*Questions? Open an issue or reach out to the maintainers.*
