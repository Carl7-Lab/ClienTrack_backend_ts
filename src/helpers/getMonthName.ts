/* eslint-disable @typescript-eslint/explicit-function-return-type */
const getMonthName = (mes: number): string => {
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];
  return meses[mes];
};

export default getMonthName;
