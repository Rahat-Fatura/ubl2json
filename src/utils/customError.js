class CustomError extends Error {
  constructor(data) {
    super(data.message);
    if (data.stack) {
      this.stack = data.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = CustomError;
