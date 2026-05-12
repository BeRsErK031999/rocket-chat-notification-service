export type RetryPolicy = {
  attempts: number;
  delayMs: number;
};

export const createRetryPolicy = (attempts: number, delayMs: number): RetryPolicy => {
  return {
    attempts,
    delayMs
  };
};
