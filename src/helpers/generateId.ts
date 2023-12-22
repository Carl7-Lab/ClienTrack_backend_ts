const generateId = (): string => {
  const random: string = Math.random().toString(32).substring(2);
  const fecha: string = Date.now().toString(32);

  return random + fecha;
};

export default generateId;
