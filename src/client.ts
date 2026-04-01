import { HttpClient, type HttpClientOptions } from "./http";
import { ReposResource } from "./resources/repos";
import { BranchesResource } from "./resources/branches";
import { TagsResource } from "./resources/tags";
import { CommitsResource } from "./resources/commits";
import { FilesResource } from "./resources/files";
import { SearchResource } from "./resources/search";
import { TokensResource } from "./resources/tokens";
import { CredentialsResource } from "./resources/credentials";
import { MirrorsResource } from "./resources/mirrors";
import { WebhooksResource } from "./resources/webhooks";
import { SandboxResource } from "./resources/sandbox";
import { PatchSetsResource } from "./resources/patch-sets";
import { ChangesResource } from "./resources/changes";
import { OperationsResource } from "./resources/operations";
import { HotResource } from "./resources/hot";
import { StateResource } from "./resources/state";
import { BatchResource } from "./resources/batch";
import { RecipesResource } from "./resources/recipes";
import { JobsResource } from "./resources/jobs";
import { StreamsResource } from "./resources/streams";

export interface GitForgeOptions {
  baseUrl: string;
  token: string;
  fetch?: typeof globalThis.fetch;
}

export class GitForge {
  readonly repos: ReposResource;
  readonly branches: BranchesResource;
  readonly tags: TagsResource;
  readonly commits: CommitsResource;
  readonly files: FilesResource;
  readonly search: SearchResource;
  readonly tokens: TokensResource;
  readonly credentials: CredentialsResource;
  readonly mirrors: MirrorsResource;
  readonly webhooks: WebhooksResource;
  readonly sandbox: SandboxResource;
  readonly patchSets: PatchSetsResource;
  readonly changes: ChangesResource;
  readonly operations: OperationsResource;
  readonly hot: HotResource;
  readonly state: StateResource;
  readonly batch: BatchResource;
  readonly recipes: RecipesResource;
  readonly jobs: JobsResource;
  readonly streams: StreamsResource;

  constructor(opts: GitForgeOptions) {
    const http = new HttpClient(opts);
    this.repos = new ReposResource(http);
    this.branches = new BranchesResource(http);
    this.tags = new TagsResource(http);
    this.commits = new CommitsResource(http);
    this.files = new FilesResource(http);
    this.search = new SearchResource(http);
    this.tokens = new TokensResource(http);
    this.credentials = new CredentialsResource(http);
    this.mirrors = new MirrorsResource(http);
    this.webhooks = new WebhooksResource(http);
    this.sandbox = new SandboxResource(http);
    this.patchSets = new PatchSetsResource(http);
    this.changes = new ChangesResource(http);
    this.operations = new OperationsResource(http);
    this.hot = new HotResource(http);
    this.state = new StateResource(http);
    this.batch = new BatchResource(http);
    this.recipes = new RecipesResource(http);
    this.jobs = new JobsResource(http);
    this.streams = new StreamsResource(http);
  }
}
