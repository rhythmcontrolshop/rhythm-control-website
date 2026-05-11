export function convertFreeAbove(val: string): number | null {
  return val === '' ? null : Number(val)
}

export function isFormInvalid(name: string, price: string, method: string): boolean {
  return !name.trim() || !price || !method
}
