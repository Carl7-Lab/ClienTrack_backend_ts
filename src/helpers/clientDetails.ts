/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Types } from 'mongoose';

interface ClientTransactionDetails {
  clientId: Types.ObjectId;
  name: string;
  lastName: string;
  alias: string;
  value: number;
}

interface Client {
  _id: Types.ObjectId;
  name: string;
  lastName: string;
  alias: string;
}

// interface Purchase {
//   client: Client;
//   value: number;
//   date: Date;
// }

interface Payment {
  client: Client;
  value: number;
  date: Date;
}

interface ReturnObj {
  client: Client;
  value: number;
  date: Date;
}
interface ClientReportDetails {
  clientId: Types.ObjectId;
  name: string;
  lastName: string;
  alias: string;
  report: {
    purchases: {
      value: number;
      lastPurchase: {
        date: Date | null;
        value: number;
      };
    };
    payments: {
      paymentValue: number;
      returnsValue: number;
      lastPayment: {
        date: Date | null;
        value: number;
      };
    };
    debtValue: number;
  };
}

export const processTransactions = (transactions: any[]) => {
  if (transactions.length === 0) {
    return {
      value: 0,
      clientsDetails: []
    };
  }

  let totalAmount: number = 0;
  const transactionsWithClientDetails: Record<
    string,
    ClientTransactionDetails
  > = {};

  transactions.forEach(({ client, value }: any) => {
    const clientInfo = client as {
      _id: Types.ObjectId;
      name: string;
      lastName: string;
      alias: string;
    };

    totalAmount += value;

    const clientId = clientInfo._id.toString();
    if (transactionsWithClientDetails[clientId] != null) {
      transactionsWithClientDetails[clientId].value += value;
    } else {
      transactionsWithClientDetails[clientId] = {
        clientId: clientInfo._id,
        name: clientInfo.name,
        lastName: clientInfo.lastName,
        alias: clientInfo.alias,
        value
      };
    }
  });

  return {
    value: totalAmount,
    clientsDetails: Object.values(transactionsWithClientDetails)
  };
};

export const processTransactionDetails = async (
  query: any,
  model: any,
  reason?: 'Pago' | 'Devolucion',
  typePay?: 'Contado' | 'Credito'
) => {
  if (reason) {
    query.reason = reason;
  }

  if (typePay) {
    query.typePay = typePay;
  }

  const transactions = await model
    .find(query)
    .select('value client')
    .populate({ path: 'client', select: 'name lastName alias' })
    .sort({ date: -1 });

  delete query.reason;
  delete query.typePay;

  return processTransactions(transactions);
};

export const getDebtors = ({
  purchases,
  payments,
  returns
}: {
  purchases: any[];
  payments: any[];
  returns: any[];
}) => {
  const clientsMap = new Map<string, ClientReportDetails>();

  purchases.forEach((purchase) => {
    const clientId = purchase.client._id.toString();
    const existingClient = clientsMap.get(clientId);

    if (existingClient) {
      existingClient.report.purchases.value += purchase.value;

      if (
        !existingClient.report.purchases.lastPurchase.date ||
        purchase.date > existingClient.report.purchases.lastPurchase.date
      ) {
        existingClient.report.purchases.lastPurchase.date = purchase.date;
        existingClient.report.purchases.lastPurchase.value = purchase.value;
      }

      existingClient.report.debtValue += purchase.value;
    } else {
      const newClient: ClientReportDetails = {
        clientId: purchase.client._id,
        name: purchase.client.name,
        lastName: purchase.client.lastName,
        alias: purchase.client.alias,
        report: {
          purchases: {
            value: purchase.value,
            lastPurchase: {
              date: purchase.date,
              value: purchase.value
            }
          },
          payments: {
            paymentValue: 0,
            returnsValue: 0,
            lastPayment: { date: null, value: 0 }
          },
          debtValue: purchase.value
        }
      };
      clientsMap.set(clientId, newClient);
    }
  });

  const updatePaymentsAndReturns = (
    transactions: Payment[] | ReturnObj[],
    paymentKey: keyof ClientReportDetails['report']['payments']
  ) => {
    transactions.forEach((transaction) => {
      const clientId = transaction.client._id.toString();
      const client = clientsMap.get(clientId);

      if (client) {
        const key = paymentKey as 'paymentValue' | 'returnsValue';

        client.report.payments[key] += transaction.value;
        client.report.debtValue -= transaction.value;

        if (
          !client.report.payments.lastPayment.date ||
          transaction.date > client.report.payments.lastPayment.date
        ) {
          client.report.payments.lastPayment.date = transaction.date;
          client.report.payments.lastPayment.value = transaction.value;
        }
      }
    });
  };

  updatePaymentsAndReturns(payments, 'paymentValue');
  updatePaymentsAndReturns(returns, 'returnsValue');

  const debtors = Array.from(clientsMap.values()).filter(
    (client) => client.report.debtValue > 0
  );

  return debtors;
};
