/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import { sendError, sendResponse } from '../helpers/responseHelper';
import Payment from '../models/Payment';
import Client from '../models/Client';

const getPayments = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const payments = await Payment.find({})
    .populate({ path: 'client', select: 'seller' })
    .select('-createdAt -updatedAt -__v -hide')
    .sort({ createdAt: -1 });

  if (payments.length === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  const filteredUser = payments.filter(
    (item) =>
      'seller' in item.client &&
      (item.client.seller as string).toString() === req.body.user._id.toString()
  );

  const sortedData = filteredUser.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const selectedItems = sortedData.slice(
    (Number(page) - 1) * Number(limit),
    (Number(page) - 1) * Number(limit) + Number(limit)
  );

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Payments Found Successfully.',
    data: { selectedItems, params: req.query }
  });
};

const newPayment = async (req: Request, res: Response) => {
  if (req.query.client === undefined || req.query.client.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  const client = await Client.findById(req.query.client);

  if (
    client === null ||
    client.hide ||
    client.seller.toString() !== req.body.user._id.toString()
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  const payment = new Payment(req.body.newPayment);

  try {
    payment.client = client._id;
    await payment.save();

    return sendResponse({
      res,
      code: 201,
      success: true,
      message: 'Payment Created Successfully.',
      data: { payment }
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const getPayment = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Payment Not Found.',
      data: {}
    });
  }

  const payment = await Payment.findById(req.params.id).populate({
    path: 'client',
    select: 'seller'
  });

  if (
    payment === null ||
    !('seller' in payment.client) ||
    (payment.client.seller as string).toString() !==
      req.body.user._id.toString()
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Payment Not Found.',
      data: {}
    });
  }

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Payment Found.',
    data: { payment }
  });
};

const updatePayment = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Payment Not Found.',
      data: {}
    });
  }

  const payment = await Payment.findById(req.params.id).populate({
    path: 'client',
    select: 'seller'
  });

  if (
    payment === null ||
    !('seller' in payment.client) ||
    (payment.client.seller as string).toString() !==
      req.body.user._id.toString()
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Payment Not Found.',
      data: {}
    });
  }

  payment.date = req.body.updatePayment.date ?? payment.date;
  payment.value = req.body.updatePayment.value ?? payment.value;
  payment.note = req.body.updatePayment.note ?? payment.note;

  try {
    const updatePayment = await payment.save();
    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'Updated Payment.',
      data: { updatePayment }
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

export { getPayments, newPayment, getPayment, updatePayment };
