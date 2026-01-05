export class RateLimitExceededError extends Error {
  constructor() {
    super('Rate limit exceeded');
  }
}
