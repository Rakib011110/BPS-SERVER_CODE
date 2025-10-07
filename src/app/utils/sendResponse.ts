import { Response } from 'express';

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  const response: any = {
    success: data.success,
    message: data.message,
    data: data.data,
  };

  if (data.meta) {
    response.meta = data.meta;
  }

  res.status(data?.statusCode).json(response);
};

export default sendResponse;