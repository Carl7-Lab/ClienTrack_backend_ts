import { type Request, type Response, type NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const authorizationHeader = req.headers.authorization;
  const JWTsecret = process.env.JWT_SECRET;
  let token: string | undefined;

  if (typeof authorizationHeader === 'undefined') {
    res.status(401).json({ msg: 'Authorization header not found' });
  }

  if (typeof JWTsecret === 'undefined') {
    throw new Error('The environment variable MONGO_URI is not defined.');
  }

  if (
    typeof authorizationHeader === 'string' &&
    authorizationHeader.startsWith('Bearer')
  ) {
    try {
      [, token] = authorizationHeader.split(' ');
      const decode: JwtPayload = jwt.verify(token, JWTsecret) as JwtPayload;
      req.body.user = await User.findById(decode.id).select(
        '-password -confirmed -token -createdAt -updatedAt -__v'
      );
      next();
      return null;
    } catch (error) {
      res.status(404).json({ msg: 'Hubo un error' });
      return null;
    }
  }

  if (token === null) {
    const error = new Error('Token no valido') as Error & { status?: number };
    error.status = 401;
    next(error);
    return null;
  }

  next();
  return null;
};

export default checkAuth;
