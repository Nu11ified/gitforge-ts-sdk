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
  }
}
