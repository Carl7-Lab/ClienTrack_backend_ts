/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import User from '../models/User';
import generateId from '../helpers/generateId';
import generateJWT from '../helpers/generateJWT';
import { sendError, sendResponse } from '../helpers/responseHelper';

const register = async (req: Request, res: Response) => {
  const { email } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists !== null) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'User already exists.',
      data: {}
    });
  }

  try {
    const user = new User(req.body);
    user.token = generateId();
    await user.save();

    return sendResponse({
      res,
      code: 201,
      success: true,
      message:
        'User Created Successfully, Check your Email to confirm your account.',
      data: {}
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const authenticate = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user === null) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'User Not Found.',
      data: {}
    });
  }

  if (!user.confirmed) {
    return sendResponse({
      res,
      code: 403,
      success: false,
      message: 'The user has not been confirmed.',
      data: {}
    });
  }

  if (user.checkPassword(password as string)) {
    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'User Authenticate.',
      data: {
        user: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          token: generateJWT(user._id as string)
        }
      }
    });
  } else {
    return sendResponse({
      res,
      code: 403,
      success: false,
      message: 'The password is wrong.',
      data: {}
    });
  }
};

const confirm = async (req: Request, res: Response) => {
  const { token } = req.params;
  const unconfirmedUser = await User.findOne({ token });

  if (unconfirmedUser === null) {
    return sendResponse({
      res,
      code: 403,
      success: false,
      message: 'Invalid Token.',
      data: {}
    });
  }

  try {
    unconfirmedUser.confirmed = true;
    unconfirmedUser.token = '';
    await unconfirmedUser.save();

    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'User Confirmed Successfully.',
      data: {}
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user === null) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'User Not Found',
      data: {}
    });
  }
  try {
    // creación de token para cambio de contraseña
    user.token = generateId();
    await user.save();

    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'We have sent an email with instructions.',
      data: {}
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const checkToken = async (req: Request, res: Response) => {
  const { token } = req.params;
  const validToken = await User.findOne({ token });

  if (validToken !== null) {
    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'Valid token and user exists.',
      data: {}
    });
  } else {
    return sendResponse({
      res,
      code: 403,
      success: false,
      message: 'Invalid Token',
      data: {}
    });
  }
};

const newPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({ token });

  if (user === null) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'User Not Found',
      data: {}
    });
  }

  user.token = '';
  user.password = password;
  try {
    await user.save();
    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'Password modified successfully.',
      data: {}
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const profile = (req: Request, res: Response) => {
  const { user } = req.body;

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'User Profile',
    data: { user }
  });
};

export {
  register,
  authenticate,
  confirm,
  forgotPassword,
  checkToken,
  newPassword,
  profile
};
