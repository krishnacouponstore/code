export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Admin access required") {
    super(message)
    this.name = "UnauthorizedError"
  }
}
