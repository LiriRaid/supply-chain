# library-docs · Stack adapters

Loaded on demand: read only the row of the project's stack.

| Stack | Notes |
|---|---|
| Angular | `angular-cli` MCP first, also for best practices before generating code. PrimeNG on the project → `primeng` MCP for component props and a11y. Tailwind, GSAP, Vitest, RxJS → `context7`. |
| React / Next.js | `context7`; Next.js answers differ sharply between App Router and Pages Router: state which one the project uses in the query. |
| Rails | `context7` for Rails, gems and AnyCable; the version comes from `Gemfile.lock`. Rails guides are versioned by URL (`guides.rubyonrails.org/v<x.y>/`) for the web fallback. |
| NestJS | `context7`; check the versions of `@nestjs/core` and the adapter (Express or Fastify), since examples differ. |
| Other | `context7`, then the official docs linked from the stack profile. |
