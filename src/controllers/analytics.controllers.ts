/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import { sendResponse } from '../helpers/responseHelper';
import Purchase from '../models/Purchase';
import Payment from '../models/Payment';
import { processTransactionDetails } from '../helpers/clientDetails';
import { convertToUTC } from '../helpers/convertoToUTC';
import Client from '../models/Client';
import { type Types } from 'mongoose';
import RowKardex from '../models/RowKardex';
import Report from '../models/Report';

const doReportByDate = async (req: Request, res: Response) => {
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

const getReports = async (req: Request, res: Response) => {
  const query: {
    seller: { $in: string[] };
  } = {
    seller: { $in: req.body.user }
  };

  const totalReports = await Report.countDocuments(query);

  // if (totalReports === 0) {
  //   return sendResponse({
  //     res,
  //     code: 404,
  //     success: false,
  //     message: 'No Records Found',
  //     data: {
  //       totalReports
  //     }
  //   });
  // }

  const reports = await Report.find(query).select('name');

  // if (reports.length === 0) {
  //   return sendResponse({
  //     res,
  //     code: 404,
  //     success: false,
  //     message: 'No Records Found.',
  //     data: {
  //       totalReports
  //     }
  //   });
  // }

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Reports Found Successfully.',
    data: {
      reports,
      totalReports
    }
  });
};

const getReport = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Monthly Report  Not Found.',
      data: {}
    });
  }

  const report = await Report.findById(req.params.id)
    .select('payments purchases')
    .populate([
      {
        path: 'payments.paymentsDetails.clientsDetails.clientId',
        select: 'name lastName alias'
      },
      {
        path: 'payments.purchasesPayDetails.clientsDetails.clientId',
        select: 'name lastName alias'
      },
      {
        path: 'payments.returnsDetails.clientsDetails.clientId',
        select: 'name lastName alias'
      },
      {
        path: 'purchases.clientsDetails.clientId',
        select: 'name lastName alias'
      }
    ]);

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Report Found Successfully.',
    data: {
      report
    }
  });
};

const getDebtorsReports = async (req: Request, res: Response) => {
  const { elapseTime } = req.query;

  const query: {
    seller: { $in: string[] };
  } = {
    seller: { $in: req.body.user }
  };

  const clients = await Client.find(query).select('_id name lastName alias');
  const currentDate = new Date(new Date().getTime() - 300 * 60 * 1000);

  const posibleDebtors = await Promise.all(
    clients.map(async (client) => {
      const lastRowKardex = await RowKardex.findOne({
        client: client._id
      })
        .select('balance debit credit date type typeModel description -_id')
        .populate({ path: 'type', select: 'date value items note typePay' })
        .sort({ createdAt: -1 });

      if (lastRowKardex !== null && lastRowKardex.balance > 0) {
        const lastKardexDate = new Date(lastRowKardex.date);
        const timeDifference = currentDate.getTime() - lastKardexDate.getTime();

        let message;
        if (timeDifference < 7 * 24 * 60 * 60 * 1000) {
          const daysDifference = Math.floor(
            timeDifference / (24 * 60 * 60 * 1000)
          );
          message = `${daysDifference} día(s)`;
        } else {
          const weeksDifference = Math.floor(
            timeDifference / (7 * 24 * 60 * 60 * 1000)
          );
          message = `${weeksDifference} semana(s)`;
        }

        return { client, lastRowKardex, timeDifference, message };
      } else {
        return null;
      }
    })
  );

  let debtors = posibleDebtors.filter((element) => element !== null);

  debtors.sort((a, b) => {
    if (a && b) {
      return a.timeDifference - b.timeDifference;
    }
    return 0;
  });

  const time15weeks = 15 * 7 * 24 * 60 * 60 * 1000;
  const time36weeks = 36 * 7 * 24 * 60 * 60 * 1000;
  const time52weeks = 52 * 7 * 24 * 60 * 60 * 1000;

  if (elapseTime) {
    const filteredDebtors = debtors.filter((debtor) => {
      if (debtor) {
        if (elapseTime === 'time15weeks') {
          return debtor.timeDifference < time15weeks;
        }
        if (elapseTime === 'time36weeks') {
          return (
            time15weeks <= debtor.timeDifference &&
            debtor.timeDifference < time36weeks
          );
        }
        if (elapseTime === 'time52weeks') {
          return (
            time36weeks <= debtor.timeDifference &&
            debtor.timeDifference < time52weeks
          );
        }
        if (elapseTime === 'timemore52weeks') {
          return time52weeks <= debtor.timeDifference;
        }
      }
      return false;
    });

    debtors = filteredDebtors;
  }

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

export {
  doReportByDate,
  getDebtorsReports,
  getClientKardex,
  getReports,
  getReport
};
