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
  HotFile, HotTreeEntry, HotTreeResult, HotCommitResult, HotRefEntry,
  BatchItem, BatchResponse, BatchSummary, Job,
  RecipeResult, RecipeJobResult, StreamEvent, RepoState,
  DiffFile, DiffResult,
  ShellExecResult, ShellMount, ShellMultiExecResult, ShellDestroyResult,
} from "./types";

// Pagination
export { paginate, type PageFetcher, type PaginateOptions } from "./pagination";

// Resource option types
export type { CreateRepoOptions, UpdateRepoOptions, ListReposOptions } from "./resources/repos";
export type { CreateBranchOptions, ListBranchesOptions, PromoteBranchOptions, PromoteResult } from "./resources/branches";
export type { CreateTagOptions, ListTagsOptions } from "./resources/tags";
export type { CreateCommitOptions, CreateCommitFromDiffOptions, ListCommitsOptions } from "./resources/commits";
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
export type {
  Change, CreateChangeOptions, AmendOptions, SquashOptions, SplitOptions,
  SplitResult, SquashResult, MaterializeResult as ChangeMaterializeResult, ImportOptions,
} from "./resources/changes";
export type { Operation } from "./resources/operations";
export type { HotReadFileOptions, HotListTreeOptions, HotCommitOptions, HotListRefsOptions, HotCreateRefOptions } from "./resources/hot";
export type { StateCurrentItem } from "./resources/state";
export type { BatchBranchItem, BatchCommitItem, BatchFileReadItem, BatchFileWriteItem, BatchRefItem, BatchPrItem, BatchDiffItem, BatchOptions } from "./resources/batch";
export type { RunRecipeOptions, PatchFleetOptions, SnapshotOptions } from "./resources/recipes";
export type { ListJobsOptions, WaitForOptions } from "./resources/jobs";
export type { RepoStreamOptions, ChangeStreamOptions } from "./resources/streams";
export type {
  ListTraverseReposOptions, GetTraverseRepoOptions, ImpactOptions,
  TraverseRepoSummary, IndexStatus, FileTreeEntry, FileSymbols, SymbolInfo, ImportInfo,
  FileSummary, ArchitectureInfo, TraverseRepoResult, ImpactedFile, ImpactResult,
} from "./resources/traverse";
export type {
  LineAnchor, PatternAnchor, TextAnchor, Indentation, IndentationSpec,
  TextPatchEdit, MetadataOperation, MetadataEdit, BinaryPatch, BinaryPatchEdit, Edit,
  ApplyEditsOptions, EditResultItem, ValidationDiagnostic, ValidationResult,
  ApplyEditsResult, ContextOptions, ContextFileEntry, ContextResult,
  CreateSessionOptions, CreateSessionResult, EditSession,
  SubmitSessionOptions, SubmitSessionResult,
} from "./resources/edit";

export type { ShellExecOptions, ShellMultiExecOptions } from "./resources/shell";

// Webhook validation (also available via "@gitforge/sdk/webhooks" subpath)
export { validateWebhook, validateWebhookSignature, type ValidateWebhookOptions } from "./webhooks/validate";
