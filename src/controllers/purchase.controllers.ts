/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import { sendError, sendResponse } from '../helpers/responseHelper';
import Purchase from '../models/Purchase';
import Client from '@models/Client';

const getPurchases = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const purchases = await Purchase.find({})
    .populate({ path: 'client', select: 'seller' })
    .select('-createdAt -updatedAt -__v -hide')
    // .limit(limit as number)
    // .skip(((page as number) - 1) * (limit as number))
    .sort({ createdAt: -1 });

  if (purchases.length === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  const filteredUser = purchases.filter(
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
    message: 'Purchases Found Successfully.',
    data: { selectedItems, params: req.query }
  });
};

const newPurchase = async (req: Request, res: Response) => {
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

  const purchase = new Purchase(req.body.newPurchase);

  try {
    purchase.client = client._id;

    purchase.value = purchase.items.reduce(
      (total, item) =>
        (item.returned as boolean) ? total : total + item.value,
      0
    );
    await purchase.save();

    return sendResponse({
      res,
      code: 201,
      success: true,
      message: 'Purchase Created Successfully.',
      data: { purchase }
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

const updatePurchase = async (req: Request, res: Response) => {
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

  purchase.date = req.body.updatePurchase.date ?? purchase.date;
  purchase.items = req.body.updatePurchase.items ?? purchase.items;
  purchase.note = req.body.updatePurchase.note ?? purchase.note;
  purchase.typePay = req.body.updatePurchase.typePay ?? purchase.typePay;
  purchase.value = purchase.items.reduce(
    (total, item) => ((item.returned as boolean) ? total : total + item.value),
    0
  );

  try {
    const updatePurchase = await purchase.save();
    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'Updated Purchase.',
      data: { updatePurchase }
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

export { getPurchases, newPurchase, getPurchase, updatePurchase };
