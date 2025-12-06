import { NextFunction, Request, Response } from "express";

// Basic error handler to keep responses consistent
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error"
  });
};


