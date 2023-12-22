import jwt, { type Secret } from 'jsonwebtoken';

const generarJWT = (id: string): string => {
  const jwtSecret: Secret | undefined = process.env.JWT_SECRET;

  if (jwtSecret === undefined) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  const token = jwt.sign({ id }, jwtSecret as Secret, {
    expiresIn: '30d'
  });

  return token;
};

export default generarJWT;
