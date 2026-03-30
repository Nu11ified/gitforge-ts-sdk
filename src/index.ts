// Main client
export { GitForge, type GitForgeOptions } from "./client";

// Error types
export { GitForgeError, RefUpdateError } from "./errors";

// All types
export type {
  Repo, Branch, Tag, Commit, CommitDetail, DiffEntry,
  TreeEntry, BlobContent, SearchMatch, SearchResult, Comparison,
  CommitResult, RepoToken, SandboxUrl, GitCredential, MirrorConfig,
  Webhook, WebhookDelivery, PaginatedResponse, CommitFileEntry,
} from "./types";

// Pagination
export { paginate, type PageFetcher, type PaginateOptions } from "./pagination";

// Resource option types
export type { CreateRepoOptions, UpdateRepoOptions, ListReposOptions } from "./resources/repos";
export type { CreateBranchOptions, ListBranchesOptions, PromoteBranchOptions, PromoteResult } from "./resources/branches";
export type { CreateTagOptions, ListTagsOptions } from "./resources/tags";
export type { CreateCommitOptions, ListCommitsOptions } from "./resources/commits";
export { CommitBuilder } from "./resources/commits";
export type { SearchCodeOptions, SearchCodeResult } from "./resources/search";
export type { CreateTokenOptions } from "./resources/tokens";
export type { CreateSandboxUrlOptions } from "./resources/sandbox";
export type { CreateCredentialOptions, UpdateCredentialOptions } from "./resources/credentials";
export type { CreateMirrorOptions, UpdateMirrorOptions } from "./resources/mirrors";
export type { CreateWebhookOptions, WebhookTestResult } from "./resources/webhooks";
export type {
  PatchSet, Patch, PatchSetWithPatches,
  CreatePatchSetOptions, UpdatePatchSetOptions, AddPatchOptions, UpdatePatchOptions,
  RebaseResult, MaterializeResult,
  PublishResult, ForkResult, UpdateChange, UpdatesResult,
  AcceptUpdatesOptions, AcceptResult, ExploreOptions, ExploreResult,
} from "./resources/patch-sets";

// Webhook validation (also available via "@gitforge/sdk/webhooks" subpath)
export { validateWebhook, validateWebhookSignature, type ValidateWebhookOptions } from "./webhooks/validate";
