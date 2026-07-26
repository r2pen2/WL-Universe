export function getOrthodoxDate(date: any): Date {
  if(date["nanoseconds"] !== undefined && date["seconds"] !== undefined) {
    return new Date(date["seconds"] * 1000 + date["nanoseconds"] / 1000000)
  }
  if(date["_nanoseconds"] !== undefined && date["_seconds"] !== undefined) {
    return new Date(date["_seconds"] * 1000 + date["_nanoseconds"] / 1000000)
  }
  return !date.toDate ? date : date.toDate()
}