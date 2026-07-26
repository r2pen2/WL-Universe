export function getLargestNumber(numbers) {
  let record = -1;
  for (const n of numbers) {
    if (n > record) record = n;
  }
  return record;
}
