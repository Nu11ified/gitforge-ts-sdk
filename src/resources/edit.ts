import type { HttpClient } from "../http";

// ---------------------------------------------------------------------------
// Edit types
// ---------------------------------------------------------------------------

export interface LineAnchor {
  startLine: number;
  endLine: number;
}

export interface PatternAnchor {
  pattern: string;
  offset?: number;
}

export type TextAnchor = LineAnchor | PatternAnchor;

export interface IndentationSpec {
  style: "tabs" | "spaces";
  width: number;
}

export type Indentation = "auto" | "preserve" | IndentationSpec;

export interface TextPatchEdit {
  type: "text-patch";
  path: string;
  anchor: TextAnchor;
  mode?: "replace" | "insert-before" | "insert-after" | "delete";
  content: string;
  indentation?: Indentation;
}

export interface MetadataOperation {
  path: string;
  value: string | number | boolean;
}

export interface MetadataEdit {
  type: "metadata";
  path: string;
  format: string;
  operations: MetadataOperation[];
}

export interface BinaryPatch {
  offset: number;
  data: string;
  encoding?: "base64" | "hex";
}

export interface BinaryPatchEdit {
  type: "binary-patch";
  path: string;
  patches: BinaryPatch[];
  validate?: boolean;
}

export type Edit = TextPatchEdit | MetadataEdit | BinaryPatchEdit;

// ---------------------------------------------------------------------------
// Apply options / results
// ---------------------------------------------------------------------------

export interface ApplyEditsOptions {
  ref?: string;
  edits: Edit[];
  commit?: boolean;
  validate?: boolean;
  message?: string;
  author?: { name: string; email: string };
  sessionId?: string;
}

export interface EditResultItem {
  path: string;
  status: "applied" | "error";
  diff?: string;
  changes?: number;
  error?: string;
}

export interface ValidationDiagnostic {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  message: string;
  source?: string;
}

export interface ValidationResult {
  ok: boolean;
  diagnostics: ValidationDiagnostic[];
}

export interface CommitInfo {
  commitSha: string;
  treeSha: string;
  branch: string;
  ref: string;
}

export interface ApplyEditsResult {
  ok: boolean;
  results: EditResultItem[];
  validation?: ValidationResult | null;
  commit?: CommitInfo | null;
}

// ---------------------------------------------------------------------------
// Context options / results
// ---------------------------------------------------------------------------

export interface ContextOptions {
  ref?: string;
  paths: string[];
  surroundingLines?: number;
}

export interface ContextFileEntry {
  path: string;
  content: string | null;
  lines: number;
  error?: string;
}

export interface ContextResult {
  ref: string;
  commitSha: string;
  files: ContextFileEntry[];
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

export interface CreateSessionOptions {
  repoId: string;
  branch: string;
  sourceRef?: string;
  description?: string;
  ttlHours?: number;
}

export interface CreateSessionResult {
  id: string;
  branch: string;
  sourceRef: string;
  sourceCommitSha: string;
  expiresAt: string;
}

export interface EditSession {
  id: string;
  repoId: string;
  branch: string;
  sourceRef: string;
  status: string;
  description?: string | null;
  commits: string[];
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
}

export interface SubmitSessionOptions {
  title: string;
  body?: string;
  targetBranch: string;
}

export interface SubmitSessionResult {
  prId: string;
  prNumber: number;
  sessionId: string;
  status: "submitted";
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

export class EditResource {
  constructor(private http: HttpClient) {}

  async apply(
    repoId: string,
    opts: ApplyEditsOptions,
  ): Promise<ApplyEditsResult> {
    return this.http.post<ApplyEditsResult>(`/edit/${repoId}`, opts);
  }

  async context(
    repoId: string,
    opts: ContextOptions,
  ): Promise<ContextResult> {
    const query: Record<string, string> = {
      paths: opts.paths.join(","),
    };
    if (opts.ref !== undefined) query.ref = opts.ref;
    if (opts.surroundingLines !== undefined) {
      query.surroundingLines = String(opts.surroundingLines);
    }
    return this.http.get<ContextResult>(
      `/edit/${repoId}/context`,
      query,
    );
  }

  async createSession(
    opts: CreateSessionOptions,
  ): Promise<CreateSessionResult> {
    return this.http.post<CreateSessionResult>("/edit/sessions", opts);
  }

  async getSession(sessionId: string): Promise<EditSession> {
    return this.http.get<EditSession>(`/edit/sessions/${sessionId}`);
  }

  async submitSession(
    sessionId: string,
    opts: SubmitSessionOptions,
  ): Promise<SubmitSessionResult> {
    return this.http.post<SubmitSessionResult>(
      `/edit/sessions/${sessionId}/submit`,
      opts,
    );
  }
}
