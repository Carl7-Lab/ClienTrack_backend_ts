/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import { sendResponse } from '../helpers/responseHelper';
import Purchase from '../models/Purchase';
import Payment from '../models/Payment';
import {
  // getDebtors,
  processTransactionDetails
} from '../helpers/clientDetails';
import { convertToUTC } from '../helpers/convertoToUTC';
import Client from '../models/Client';
import { type Types } from 'mongoose';
import RowKardex from '../models/RowKardex';

const getReport = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const baseQuery: {
    seller: { $in: string[] };
    date?: { $gte?: Date; $lte?: Date };
  } = {
    seller: { $in: req.body.user }
  };

  if (startDate && endDate) {
    const startOfDay = new Date(startDate as string);
    const endOfDay = new Date(endDate as string);

    baseQuery.date = {
      $gte: convertToUTC(startOfDay),
      $lte: convertToUTC(endOfDay, true)
    };
  }

  const purchasesAllDetails = await processTransactionDetails(
    { ...baseQuery },
    Purchase,
    undefined
  );
  const paymentsDetails = await processTransactionDetails(
    { ...baseQuery },
    Payment,
    'Pago'
  );
  const returnsDetails = await processTransactionDetails(
    { ...baseQuery },
    Payment,
    'Devolucion'
  );
  const purchasesPayDetails = await processTransactionDetails(
    { ...baseQuery, typePay: 'Contado' },
    Purchase,
    undefined,
    'Contado'
  );

  const totalPayments =
    paymentsDetails.value + returnsDetails.value + purchasesPayDetails.value;

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Report Successfully.',
    data: {
      purchases: purchasesAllDetails,
      payments: {
        value: totalPayments,
        purchasesPayDetails,
        paymentsDetails,
        returnsDetails
      }
    }
  });
};

const getDebtorsReports = async (req: Request, res: Response) => {
  const query: {
    seller: { $in: string[] };
  } = {
    seller: { $in: req.body.user }
  };

  const clients = await Client.find(query).select('_id name lastName alias');

  const posibleDebtors = await Promise.all(
    clients.map(async (client) => {
      const lastRowKardex = await RowKardex.findOne({
        client: client._id
      })
        .select('balance date type typeModel description -_id')
        .populate({ path: 'type', select: 'date value items note typePay' })
        .sort({ createdAt: -1 });

      return lastRowKardex !== null && lastRowKardex.balance > 0
        ? { client, lastRowKardex }
        : null;
    })
  );

  const debtors = posibleDebtors.filter((element) => element !== null);

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Client Reports Successfully.',
    data: {
      debtors
    }
  });
};

const getClientKardex = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  const client = await Client.findById(req.params.id).select('hide seller');

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

  const { page = 1, limit = 10, startDate, endDate } = req.query;

  const query: {
    seller: { $in: string[] };
    client: Types.ObjectId;
    createdAt?: { $gte?: Date; $lt?: Date };
  } = {
    seller: { $in: req.body.user },
    client: client._id
  };

  if (startDate && endDate) {
    const startOfDay = new Date(startDate as string);
    const endOfDay = new Date(endDate as string);

    query.createdAt = {
      $gte: convertToUTC(startOfDay),
      $lt: convertToUTC(endOfDay, true)
    };
  }

  const totalRowsKardex = await RowKardex.countDocuments(query);

  if (totalRowsKardex === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  const rowsKardex = await RowKardex.find(query)
    .select('date description debit credit balance type typeModel -_id')
    .populate({
      path: 'type',
      select: '-client -createdAt -updatedAt -seller -_id -__v'
    })
    .limit(limit as number)
    .skip(((page as number) - 1) * (limit as number))
    .sort({ createdAt: -1 });

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Client Kardex Successfully.',
    data: {
      rowsKardex,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalRowsKardex
      }
    }
  });
};

export { getReport, getDebtorsReports, getClientKardex };
