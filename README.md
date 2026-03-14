# somebody-otta

An OpenClaw service wrapper to provide managed personal assistant benefits for family members.

## Initial Scope

- Multi-tenant agent architecture for distinct family member contexts.
- Secure, permissioned interaction layer (starting with Telegram).
- Roadmap toward a native mobile app with specialized features for health, travel, and home automation.

## Architecture

```
src/
├── types/index.ts              — Shared domain types (TenantId, AgentStatus, …)
├── models/
│   ├── TenantContext.ts        — Isolated memory & credential store per tenant
│   └── TenantRegistry.ts      — Central registry mapping tenants ↔ Telegram IDs
├── agents/
│   ├── FamilyMemberAgent.ts   — Per-tenant agent (lifecycle + message handling)
│   ├── AgentProvisioner.ts    — Onboarding workflow for new family members
│   └── AgentManager.ts        — Coordinator: routing, lifecycle, health reports
├── telegram/
│   ├── MessageRouter.ts       — Routes Telegram messages to the correct agent
│   └── TelegramBot.ts         — Telegraf bot integration
├── admin/
│   └── AdminDashboard.ts      — Console-based health & usage monitor
└── index.ts                   — Main entry point
```

### Key design decisions

| Concern | Approach |
|---|---|
| **Data isolation** | Each `TenantContext` owns its own in-memory `MemoryStore` and `Map<service, Credential>`. Objects are frozen; credential getters return copies. |
| **Cross-tenant protection** | `TenantRegistry` throws on duplicate tenant IDs and duplicate Telegram user IDs, preventing collisions at registration time. |
| **Agent lifecycle** | `provisioned → active → suspended → deprovisioned`. A deprovisioned agent can never be reactivated. |
| **Message routing** | Telegram user ID is the lookup key. Unknown users receive a clear error reply rather than leaking any tenant data. |
| **AI service** | `FamilyMemberAgent.handleMessage()` accepts an injectable handler, keeping the AI service decoupled and easy to swap or mock in tests. |

## Getting Started

### Requirements

- Node.js ≥ 18
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run (development)

```bash
TELEGRAM_BOT_TOKEN=<your-token> npm run dev
```

### Onboard a family member

In `src/index.ts` call `manager.onboard(config)` with the family member's Telegram user ID:

```ts
manager.onboard({
  displayName: "Alice",
  role: "member",
  telegramUserId: 123456789,   // find with @userinfobot
  permissions: { canAccessCalendar: true },
});
```

All subsequent messages from that Telegram user are automatically routed to their isolated agent.

## Testing

```bash
npm test
```

58 tests across 6 suites covering data isolation, agent provisioning, message routing, and the admin dashboard.

