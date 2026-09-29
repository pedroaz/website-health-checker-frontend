# Pulse — Website Health Checker frontend

Next.js App Router + TypeScript dashboard for a local website monitoring showcase. Add a URL and email, run checks, pause/resume, inspect recent history and delete monitors. Result emails are captured in Mailpit.

## Run the full application

Keep this checkout beside `website-health-checker-backend` and run from that repository:

```sh
docker compose --profile demo up -d --build --wait
```

Open [Pulse](http://localhost:3000) and [Mailpit](http://localhost:8025). Try `http://demo-target:8080/healthy`, `/failing`, `/redirect` or `/slow` as the website. The plain `docker compose up --build` command starts the core application without demo targets.

## Frontend development

Use Node 24 (container and `.node-version`: 24.14.0).

```sh
npm ci
npm run dev
npm run build
npm run typecheck
npm run format:check
```

The API defaults to `http://localhost:8080`; override with API_BASE_URL (see `.env.example`). Stop the Compose frontend first if running Next.js locally on port 3000. API forwarding uses server-only runtime configuration, not baked browser secrets.

## Tests and agents

```sh
# Recommended: isolated containers, real DB/SMTP, backend + browser + restart checks
../website-health-checker-backend/scripts/test.sh
# Against an already-running demo stack
npx playwright install chromium
npm run test:e2e
npm run test:e2e:report
```

The suite includes lifecycle, email delivery, unhealthy/timeout, private-network validation, and mobile layout scenarios. Screenshots and traces are retained on failure. `BASE_URL`, `API_URL`, and `MAILPIT_URL` override defaults. Tests never use public websites and clean up their own monitors. Full-suite execution uses separate project-scoped data volumes.

Official Playwright Codex planner/generator/healer definitions are included under `.codex/agents/`. See [AGENTS.md](AGENTS.md) for host setup, OpenHands usage and repair rules, and [specs/showcase.md](specs/showcase.md) for the browser test plan. Ordinary Playwright tests do not need an LLM or OpenAI key. Generated agent definitions can be refreshed with `npx playwright init-agents --loop=codex`; preserve the useful seed test when doing so.

The [backend README](https://github.com/pedroaz/website-health-checker-backend/blob/main/README.md) owns startup, API and production-gap documentation. The full approved [implementation plan](https://github.com/pedroaz/website-health-checker-backend/blob/main/PLAN.md) lives in the backend root. This is deliberately a local single-user demo; authentication, production operations, deployment, hosted CI and OpenAI integration are outside this iteration.
