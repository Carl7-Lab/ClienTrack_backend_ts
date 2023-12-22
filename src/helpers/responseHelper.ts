import { type Response } from 'express';

interface ResponseParams {
  res: Response;
  code: number;
  success: boolean;
  message: string;
  data: unknown;
}

interface ErrorParams {
  res: Response;
  err: unknown;
}

export function sendResponse({
  res,
  code,
  success,
  message,
  data
}: ResponseParams): Response {
  return res.status(code).json({
    success,
    message,
    data
  });
}

export function sendError({ res, err }: ErrorParams): Response {
  console.log(err);

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    data: { err }
  });
}
