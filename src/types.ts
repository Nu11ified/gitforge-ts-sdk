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
  createdAt: string;
  updatedAt: string;
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
  responseStatus: string | null;
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
