export const sendSuccess = (res: any, data: any, message = 'Success') => {
  return res.status(200).json({ success: true, message, data });
};

export const sendError = (res: any, status: number, message: string, errors: any = null) => {
  return res.status(status).json({ success: false, message, errors });
};
