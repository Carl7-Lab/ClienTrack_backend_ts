/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import { sendError, sendResponse } from '../helpers/responseHelper';
import Payment from '../models/Payment';
import Client from '../models/Client';
import { Types } from 'mongoose';
import { convertToUTC } from '../helpers/convertoToUTC';
import RowKardex from '../models/RowKardex';

const getPayments = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, client, startDate, endDate } = req.query;

  const query: {
    seller: { $in: string[] };
    client?: Types.ObjectId;
    date?: { $gte?: Date; $lte?: Date };
  } = {
    seller: { $in: req.body.user }
  };

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (client) {
    if (client.length !== 24) {
      return sendResponse({
        res,
        code: 404,
        success: false,
        message: 'Client Not Found.',
        data: {}
      });
    }
    query.client = new Types.ObjectId(client as string);
  }

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (startDate && endDate) {
    const startOfDay = new Date(startDate as string);
    const endOfDay = new Date(endDate as string);

    query.date = {
      $gte: convertToUTC(startOfDay),
      $lte: convertToUTC(endOfDay, true)
    };
  }

  const totalPayments = await Payment.countDocuments(query);

  if (totalPayments === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  const payments = await Payment.find(query)
    .select('-createdAt -updatedAt -__v -hide')
    .populate({ path: 'client', select: 'name lastName alias seller' })
    .limit(limit as number)
    .skip(((page as number) - 1) * (limit as number))
    .sort({ date: -1 });

  if (payments.length === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Payments Found Successfully.',
    data: {
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalPayments
      }
    }
  });
};

const newPayment = async (req: Request, res: Response) => {
  if (
    req.body.newPayment.client === undefined ||
    req.body.newPayment.client.length !== 24
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  const client = await Client.findById(req.body.newPayment.client).select(
    'seller hide _id'
  );

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

  const lastRowKardex = await RowKardex.findOne({ client: client._id }).sort({
    createdAt: -1
  });

  if (lastRowKardex === null) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Kardex Not Found',
      data: {}
    });
  }

  const payment = new Payment(req.body.newPayment);
  const rowKardex = new RowKardex(req.body.newPayment);

  try {
    payment.client = client._id;
    payment.seller = client.seller;

    const balance: number = lastRowKardex.balance;
    rowKardex.client = client._id;
    rowKardex.seller = client.seller;

    rowKardex.debit = 0;
    rowKardex.credit = payment.value;
    rowKardex.balance = balance - payment.value;
    if (payment.reason === 'Pago') {
      rowKardex.description = 'Pago';
    }
    if (payment.reason === 'Devolucion') {
      rowKardex.description = 'Devolucion';
    }

    const paymentAdd = await payment.save();

    rowKardex.typeModel = 'Payment';
    rowKardex.type = paymentAdd._id;

    await rowKardex.save();

    return sendResponse({
      res,
      code: 201,
      success: true,
      message: 'Payment Created Successfully.',
      data: { payment, rowKardex }
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

export { getPayments, newPayment, getPayment };
