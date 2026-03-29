# @gitforge/sdk

TypeScript SDK for [GitForge](https://git-forge.dev) — Git infrastructure for developers who build on Git.

## Install

```bash
npm install @gitforge/sdk
```

## Quick Start

```typescript
import { GitForge } from "@gitforge/sdk";

const client = new GitForge({
  baseUrl: "https://api.git-forge.dev",
  token: "gf_your_token_here",
});

// Create a repo
const repo = await client.repos.create({
  name: "my-repo",
  visibility: "private",
});

// Commit files without a git client
await client.commits
  .create(repo.id, {
    branch: "main",
    message: "initial commit",
    authorName: "Your Name",
    authorEmail: "you@example.com",
  })
  .addFile("README.md", "# My Project")
  .addFile("src/index.ts", "console.log('hello');")
  .send();

// List repos
const { data } = await client.repos.list({ limit: 10 });

// Browse files
const tree = await client.files.getTree(repo.id, "main", "/");

// Search code
const results = await client.search.code("function handlePush");
```

## Resources

The SDK exposes these resource classes on the client:

| Resource | Methods |
|----------|---------|
| `repos` | `create`, `list`, `get`, `update`, `delete` |
| `branches` | `list`, `create`, `delete`, `promote` |
| `tags` | `list`, `create`, `delete` |
| `commits` | `create` (builder), `list`, `get` |
| `files` | `getBlob`, `getTree` |
| `search` | `code` |
| `tokens` | `create`, `list`, `revoke` |
| `credentials` | `list`, `create`, `delete` |
| `mirrors` | `list`, `create`, `sync`, `delete` |
| `webhooks` | `create`, `list`, `update`, `delete`, `test` |

## Pagination

```typescript
import { paginate } from "@gitforge/sdk";

for await (const repo of paginate((limit, offset) =>
  client.repos.list({ limit, offset })
)) {
  console.log(repo.name);
}
```

## Webhook Validation

```typescript
import { validateWebhook } from "@gitforge/sdk/webhooks";

const isValid = validateWebhook({
  payload: rawBody,
  signature: req.headers["x-gitforge-signature"],
  secret: "your_webhook_secret",
  timestamp: req.headers["x-gitforge-timestamp"],
  tolerance: 300, // seconds
});
```

## Error Handling

```typescript
import { GitForgeError } from "@gitforge/sdk";

try {
  await client.repos.get("nonexistent");
} catch (err) {
  if (err instanceof GitForgeError) {
    console.log(err.status); // 404
    console.log(err.code);   // "NOT_FOUND"
    console.log(err.message);
  }
}
```

## Contributing

This SDK is developed inside the [GitForge monorepo](https://github.com/Nu11ified/GitForge) at `sdks/typescript/` and published to this repo via git subtree.

To contribute:

1. Clone the monorepo: `git clone https://github.com/Nu11ified/GitForge.git`
2. Install dependencies: `bun install`
3. Make changes in `sdks/typescript/`
4. Run tests: `bun test sdks/typescript/`
5. Submit a PR to the monorepo

## License

MIT
