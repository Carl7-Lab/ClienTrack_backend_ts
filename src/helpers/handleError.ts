import { type Response } from 'express';

const handleError = (
  res: Response,
  statusCode: number,
  message: string
): void => {
  const error = new Error(message);
  res.status(statusCode).json({ msg: error.message });
};

export default handleError;
