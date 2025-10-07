import { Request, Response, NextFunction } from 'express';

export function validateTransactionId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { transactionId } = req.params;
  if (!transactionId || typeof transactionId !== 'string' || transactionId.length !== 24) {
    res.status(400).json({ message: 'Invalid transaction ID' });
    return;
  }
  next();
}