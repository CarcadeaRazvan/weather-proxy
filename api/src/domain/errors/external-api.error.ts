export class ExternalAPIError extends Error {
  constructor() {
    super('External API failed to respond');
  }
}
