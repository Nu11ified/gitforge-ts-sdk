/** Base error for all GitForge API errors. */
export class GitForgeError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GitForgeError";
  }
}

/** Thrown when a ref update fails (e.g., branch moved during commit). */
export class RefUpdateError extends GitForgeError {
  constructor(
    message: string,
    public readonly currentSha: string,
  ) {
    super(409, "branch_moved", message);
    this.name = "RefUpdateError";
  }
}
