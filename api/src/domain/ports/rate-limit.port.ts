export interface RateLimitPort {
  check(userId: string): Promise<void>;
}
