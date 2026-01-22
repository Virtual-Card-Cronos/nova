# Comparison: `lib/agent/` vs `app/actions/` for Agent Service

## Current Situation

The agent service is currently:
- Located in `services/agent/src/` (outside Next.js app)
- Called via API route: `/api/agent/process`
- Used from client component via `fetch()`
- Contains: AI processing, Gift Up! API calls, tool functions

## Option 1: `apps/web/src/lib/agent/` (Library/Utilities)

### Structure
```
apps/web/src/lib/
├── agent/
│   ├── agent-processor.ts    # Main processing logic
│   ├── agent.ts              # AI SDK integration
│   ├── tools.ts              # Gift Up! API functions
│   ├── prompts.ts            # System prompts
│   └── types.ts              # TypeScript types
├── facilitator.ts            # (existing)
├── policy.ts                 # (existing)
└── types.ts                  # (existing)
```

### Usage Pattern
```typescript
// In API route
import { processAgentRequest } from '@/lib/agent/agent-processor'

export async function POST(request: NextRequest) {
  const result = await processAgentRequest({...})
  return NextResponse.json(result)
}

// Or in Server Action
'use server'
import { processAgentRequest } from '@/lib/agent/agent-processor'

export async function processAgent(message: string) {
  return await processAgentRequest({ message, ... })
}
```

### ✅ Pros
- **Flexible**: Can be imported by API routes, Server Actions, or other server code
- **Consistent**: Matches existing pattern (`lib/facilitator.ts`, `lib/policy.ts`)
- **Reusable**: Can be used in multiple places (API routes, Server Actions, middleware)
- **Separation**: Business logic separate from route handlers
- **Testable**: Easy to unit test in isolation
- **No framework lock-in**: Pure functions, not tied to Next.js patterns

### ❌ Cons
- **Indirect**: Still need API route or Server Action wrapper
- **Less type-safe**: No automatic type inference from client to server
- **More boilerplate**: Need to create API route wrapper

---

## Option 2: `apps/web/src/app/actions/agent.ts` (Server Actions)

### Structure
```
apps/web/src/app/
├── actions/
│   └── agent.ts              # Server Actions with "use server"
├── api/
│   └── agent/
│       └── process/
│           └── route.ts      # (could be removed)
```

### Usage Pattern
```typescript
// apps/web/src/app/actions/agent.ts
'use server'

import { initializeCryptoAI, processWithAgent } from './agent-core'
import { findCard, issueGiftCard } from './tools'

export async function processAgentRequest(
  message: string,
  userAddress: string,
  context?: { previousMessages: Array<{role: string, content: string}> }
) {
  // Direct implementation or call to lib functions
  const result = await processWithAgent(message, userAddress, ...)
  return result
}

// In client component
import { processAgentRequest } from '@/app/actions/agent'

const response = await processAgentRequest(message, address, context)
// Type-safe! No fetch() needed
```

### ✅ Pros
- **Type-safe**: Full TypeScript inference from client to server
- **Direct calls**: No `fetch()` needed in client components
- **Modern**: Next.js 13+ recommended pattern
- **Less boilerplate**: No API route wrapper needed
- **Better DX**: Autocomplete and type checking
- **Automatic serialization**: Next.js handles data serialization

### ❌ Cons
- **Framework-specific**: Tied to Next.js Server Actions
- **Less flexible**: Can only be called from client components or other Server Actions
- **Mutation-focused**: Server Actions are designed for mutations, not queries (though they work)
- **Different pattern**: Doesn't match existing `lib/` structure
- **File location**: Actions in `app/actions/` vs utilities in `lib/`

---

## Recommendation: **`lib/agent/`** ✅

### Why `lib/agent/` is Better for This Use Case:

1. **Consistency**: Matches existing codebase pattern
   - `lib/facilitator.ts` - x402 facilitator utilities
   - `lib/policy.ts` - Smart contract policy utilities
   - `lib/agent/` - AI agent utilities

2. **Flexibility**: Can be used in multiple ways
   - API routes (current usage)
   - Server Actions (if you want to convert later)
   - Other server-side code

3. **Separation of Concerns**:
   - `lib/agent/` = Business logic (pure functions)
   - `app/api/agent/process/route.ts` = HTTP interface
   - `app/actions/agent.ts` = Server Action interface (optional)

4. **Testability**: Pure functions are easier to test

5. **Reusability**: Can be imported by multiple API routes or Server Actions

### Hybrid Approach (Best of Both Worlds)

You can have **both**:

```
apps/web/src/
├── lib/
│   └── agent/              # Pure business logic
│       ├── agent-processor.ts
│       ├── agent.ts
│       ├── tools.ts
│       └── types.ts
└── app/
    ├── actions/
    │   └── agent.ts        # Server Action wrapper (optional)
    └── api/
        └── agent/
            └── process/
                └── route.ts # API route wrapper
```

**Server Action** (optional, for better client DX):
```typescript
// app/actions/agent.ts
'use server'

import { processAgentRequest } from '@/lib/agent/agent-processor'

export async function processAgent(
  message: string,
  userAddress: string,
  context?: any
) {
  return await processAgentRequest({ message, userAddress, context })
}
```

**API Route** (keep for REST compatibility):
```typescript
// app/api/agent/process/route.ts
import { processAgentRequest } from '@/lib/agent/agent-processor'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await processAgentRequest(body)
  return NextResponse.json(result)
}
```

---

## Final Recommendation

**Move to `lib/agent/`** because:
1. ✅ Matches existing codebase structure
2. ✅ More flexible and reusable
3. ✅ Can add Server Actions later if needed
4. ✅ Easier to test and maintain
5. ✅ Keeps business logic separate from framework

You can always add Server Actions later as a thin wrapper around `lib/agent/` functions if you want the type-safe client calls.
