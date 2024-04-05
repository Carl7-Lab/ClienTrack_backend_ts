/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { processTransactionDetails } from 'src/helpers/clientDetails';
import { convertToUTC } from 'src/helpers/convertoToUTC';
import getMonthName from 'src/helpers/getMonthName';
import Payment from 'src/models/Payment';
import Purchase from 'src/models/Purchase';
import Report from 'src/models/Report';
import User from 'src/models/User';

export const generateMonthReport = async () => {
  //   console.log('haciendo los reportes de cada usuario ...!!!');

  const currentDay = new Date();
  const ecuadorTime = new Date(currentDay.getTime() - 300 * 60 * 1000);
  //   mes anterior
  //   const firstDayOfMonth = new Date(
  //     ecuadorTime.getFullYear(),
  //     ecuadorTime.getMonth() - 1,
  //     1
  //   );
  //   const lastDayOfMonth = new Date(
  //     ecuadorTime.getFullYear(),
  //     ecuadorTime.getMonth(),
  //     0
  //   );

  //   mes actual
  const firstDayOfMonth = new Date(
    ecuadorTime.getFullYear(),
    ecuadorTime.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    ecuadorTime.getFullYear(),
    ecuadorTime.getMonth() + 1,
    0
  );

  //   '2019-01-01' a '2024-03-31'
  //   const firstDayOfMonth = new Date('2019-01-01');
  //   const lastDayOfMonth = new Date('2024-03-31');

  const users = await User.find().select('_id userName email');
  //   console.log('Usuarios: ', users.length);

  const baseQuery: {
    seller?: string;
    date?: { $gte?: Date; $lte?: Date };
  } = {
    date: {
      $gte: convertToUTC(firstDayOfMonth),
      $lte: convertToUTC(lastDayOfMonth, true)
    }
  };

  for (const user of users) {
    baseQuery.seller = user._id;

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

    const year = lastDayOfMonth.getFullYear();
    const month = getMonthName(lastDayOfMonth.getMonth());

    const report = {
      name: `${month}-${year}`,
      //   name: 'enero-2019 => marzo-2024',
      purchases: purchasesAllDetails,
      payments: {
        value: totalPayments,
        paymentsDetails,
        purchasesPayDetails,
        returnsDetails
      },
      seller: user._id
    };

    const newReport = new Report(report);
    try {
      await newReport.save();
      console.log(
        'report successfully created'
        // newReport
      );
    } catch (error) {
      console.log(error);
    }
  }
};
