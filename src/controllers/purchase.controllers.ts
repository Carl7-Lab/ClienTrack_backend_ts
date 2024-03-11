/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import { sendError, sendResponse } from '../helpers/responseHelper';
import Purchase from '../models/Purchase';
import Client from '@models/Client';
import { Types } from 'mongoose';
import { convertToUTC } from '@helpers/convertoToUTC';
import RowKardex from '@models/RowKardex';

const getPurchases = async (req: Request, res: Response) => {
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
      $lte: convertToUTC(endOfDay)
    };
  }

  const totalPurchases = await Purchase.countDocuments(query);

  if (totalPurchases === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  const purchases = await Purchase.find(query)
    .select('-createdAt -updatedAt -__v -hide')
    .populate({ path: 'client', select: 'name lastName alias seller' })
    .limit(limit as number)
    .skip(((page as number) - 1) * (limit as number))
    .sort({ date: -1 });

  if (purchases.length === 0) {
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
    message: 'Purchases Found Successfully.',
    data: {
      purchases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalPurchases
      }
    }
  });
};

const newPurchase = async (req: Request, res: Response) => {
  if (
    req.body.newPurchase.client === undefined ||
    req.body.newPurchase.client.length !== 24
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  const client = await Client.findById(req.body.newPurchase.client).select(
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

  const purchase = new Purchase(req.body.newPurchase);
  const rowKardex = new RowKardex(req.body.newPurchase);

  try {
    purchase.client = client._id;
    purchase.seller = client.seller;
    purchase.value = purchase.items.reduce(
      (total, item) => total + item.value,
      0
    );

    let balance: number = 0;
    rowKardex.client = client._id;
    rowKardex.seller = client.seller;
    if (lastRowKardex !== null) {
      balance = lastRowKardex.balance;
    }
    if (purchase.typePay === 'Credito') {
      rowKardex.debit = purchase.value;
      rowKardex.credit = 0;
      rowKardex.balance = balance + purchase.value;
      rowKardex.description = 'Compra a Credito';
    }
    if (purchase.typePay === 'Contado') {
      rowKardex.debit = purchase.value;
      rowKardex.credit = purchase.value;
      rowKardex.balance = balance;
      rowKardex.description = 'Compra al Contado';
    }

    const purchaseAdd = await purchase.save();

    rowKardex.typeModel = 'Purchase';
    rowKardex.type = purchaseAdd._id;

    await rowKardex.save();

    return sendResponse({
      res,
      code: 201,
      success: true,
      message: 'Purchase Created Successfully.',
      data: { purchase, rowKardex }
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const getPurchase = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Purchase Not Found.',
      data: {}
    });
  }

  const purchase = await Purchase.findById(req.params.id).populate({
    path: 'client',
    select: 'seller'
  });

  if (
    purchase === null ||
    !('seller' in purchase.client) ||
    (purchase.client.seller as string).toString() !==
      req.body.user._id.toString()
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Purchase Not Found.',
      data: {}
    });
  }

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Purchase Found.',
    data: { purchase }
  });
};

export { getPurchases, newPurchase, getPurchase };
