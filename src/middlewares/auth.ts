
import jwt from "jsonwebtoken";
import httpStatus from "http-status";

import config from "../config";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

const auth = (...roles: string[]) => {
  return catchAsync(async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (roles.length && !roles.includes(decoded.role)) {
      throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
    }

    req.user = decoded;
    next();
  });
};

export default auth;