export class MatpinAnalysisError extends Error {
  constructor(public readonly code: string, public readonly retryable: boolean) {
    super(code);
  }
}
