export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function fail(status, message) {
  throw new HttpError(status, message);
}
export function errorHandler(error, req, res, next) {
  if (error.code === "ER_DUP_ENTRY")
    return res
      .status(409)
      .json({ error: { message: "A record with this value already exists" } });
  const status = error.status || 500;
  if (status >= 500) console.error("Request failed:", error.code || error.name);
  res
    .status(status)
    .json({
      error: {
        message: status >= 500 ? "Internal server error" : error.message,
      },
    });
}
