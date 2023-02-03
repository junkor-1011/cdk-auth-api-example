export const sum = (...args: number[]): number => {
  const initialValue = 0;
  const sum = args.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
  return sum;
};
