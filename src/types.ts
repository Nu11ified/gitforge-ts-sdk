/** Repository object returned by the API. */
export interface Repo {
  id: string;
  name: string;
  slug?: string;
  ownerSlug?: string;
  description?: string;
  visibility: "public" | "private";
  defaultBranch: string;
  lfsEnabled: boolean;
  isArchived: boolean;
  forkedFrom?: string;
  createdAt?: string;
  updatedAt?: string;
  starCount?: number;
  openPrCount?: number;
  openIssueCount?: number;
  topics?: string[];
  mergeCommitTemplate?: string | null;
}

/** Branch reference. */
export interface Branch {
  name: string;
  sha: string;
  expiresAt?: string;
}

/** Tag reference. */
export interface Tag {
  name: string;
  sha: string;
}

/** Commit object. */
export interface Commit {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  parentShas: string[];
}

/** Commit with file changes (from single-commit endpoint). */
export interface CommitDetail extends Commit {
  tree: string;
  files: Array<{ path: string; status: string }>;
}

/** Diff entry for file comparison. */
export interface DiffEntry {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

/** Tree entry (directory listing). */
export interface TreeEntry {
  name: string;
  type: string;
  mode: string;
  sha: string;
}

/** File blob content. */
export interface BlobContent {
  content: string;
  size: number;
}

/** Code search match within a file. */
export interface SearchMatch {
  line: number;
  content: string;
  highlight: string;
}

/** Code search result for a single file. */
export interface SearchResult {
  repoId: string;
  repoName: string;
  filePath: string;
  branch: string;
  language: string | null;
  matches: SearchMatch[];
}

/** Comparison between two refs. */
export interface Comparison {
  ahead: number;
  behind: number;
  commits: Array<{ sha: string; message: string; author: string; date: string }>;
  files: Array<{ path: string; status: string }>;
}

/** Commit result from direct commit API. */
export interface CommitResult {
  commitSha: string;
  treeSha: string;
  branch: string;
  ref: string;
  parentShas: string[];
  oldSha: string;
  newSha: string;
}

/** Repo-scoped token. */
export interface RepoToken {
  token: string;
  patId: string;
  expiresAt: string;
  remoteUrl: string;
}

/** Sandbox URL response for isolated code execution environments. */
export interface SandboxUrl {
  remoteUrl: string;
  token: string;
  expiresAt: string;
  branch: string;
  ephemeralBranch: string | null;
}

/** Git credential (token field never returned). */
export interface GitCredential {
  id: string;
  provider: string;
  username: string | null;
  label: string | null;
  createdAt: string;
}

/** Mirror configuration. */
export interface MirrorConfig {
  id: string;
  sourceUrl: string;
  interval: number;
  lastSyncAt: string | null;
  lastError: string | null;
  enabled: boolean;
  createdAt: string;
  direction: string;
  provider: string;
  credentialId: string | null;
}

/** Webhook configuration. */
export interface Webhook {
  id: string;
  url: string;
  events: string[] | null;
  active: boolean;
}

/** Webhook delivery log. */
export interface WebhookDelivery {
  id: string;
  eventType: string;
  payload: string;
  responseStatus: number | null;
  responseBody: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

/** Paginated API response. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** Options for creating a commit file entry. */
export interface CommitFileEntry {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
  mode?: "100644" | "100755" | "120000";
}

/** Hot-path file read result. */
export interface HotFile {
  path: string;
  content?: string;
  size?: number;
  mode?: string;
  sha?: string;
  encoding?: string;
  lastCommit?: { sha: string; message: string; author: string; date: string };
}

/** Hot-path tree entry. */
export interface HotTreeEntry {
  name: string;
  path: string;
  type: "blob" | "tree";
  mode: string;
  sha: string;
  size?: number;
}

/** Hot-path tree response. */
export interface HotTreeResult {
  entries: HotTreeEntry[];
  truncated?: boolean;
}

/** Hot-path commit result. */
export interface HotCommitResult {
  commitSha: string;
  treeSha: string;
  parentShas: string[];
  ref: string;
}

/** Hot-path ref entry. */
export interface HotRefEntry {
  name: string;
  sha: string;
  type: "branch" | "tag";
}

/** Batch operation result (per item). */
export interface BatchItem<T = unknown> {
  index: number;
  status: "fulfilled" | "rejected";
  value?: T;
  error?: { code: string; message: string };
}

/** Batch operation response. */
export interface BatchResponse<T = unknown> {
  results: BatchItem<T>[];
  summary: BatchSummary;
}

/** Batch summary statistics. */
export interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
}

/** Job status object. */
export interface Job {
  id: string;
  type: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: { completed: number; failed: number; total: number } | null;
  result: unknown;
  error: { code: string; message: string } | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** Recipe execution result (sync). */
export interface RecipeResult {
  status: "completed" | "failed";
  steps: Array<{ name: string; summary: BatchSummary }>;
  results: unknown[];
}

/** Recipe execution result (async). */
export interface RecipeJobResult {
  jobId: string;
  status: "running";
}

/** SSE event from a change stream. */
export interface StreamEvent {
  event: string;
  data: Record<string, unknown>;
}

/** Per-repo state result from /state/current. */
export interface RepoState {
  repoId: string;
  ref: string;
  headSha: string | null;
  files: Array<HotFile | { path: string; status: "not_found" }>;
}

/** Diff file entry from batch diff. */
export interface DiffFile {
  path: string;
  status: string;
  oldPath?: string;
  mode?: string;
  oldMode?: string;
  blobSha?: string;
  oldBlobSha?: string;
}

/** Batch diff result per item. */
export interface DiffResult {
  repoId: string;
  base: string;
  head: string;
  files: DiffFile[];
}

/** Result from a single-repo shell command execution. */
export interface ShellExecResult {
  sessionId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  ref: string | null;
  headSha: string | null;
  pendingChanges: number;
}

/** Mount entry in a multi-repo shell session. */
export interface ShellMount {
  path: string;
  repoId: string;
  ref: string;
  headSha: string;
  pendingChanges: number;
}

/** Result from a multi-repo shell command execution. */
export interface ShellMultiExecResult {
  sessionId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  mounts: ShellMount[];
}

/** Result from destroying a shell session. */
export interface ShellDestroyResult {
  destroyed: boolean;
  uncommittedFiles: number;
}
