import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
export function isValidPhoneNumber(phone: string): boolean {
  const re = /^\+?[1-9]\d{1,14}$/
  return re.test(phone)
}
export function isValidDate(date: string): boolean {
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!re.test(date)) return false
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}
export function isValidTime(time: string): boolean {
  const re = /^([01]\d|2[0-3]):([0-5]\d)$/
  return re.test(time)
}
export function isValidDateTime(dateTime: string): boolean {    
  const re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/
  if (!re.test(dateTime)) return false
  const parsedDate = new Date(dateTime)
  return !isNaN(parsedDate.getTime())
}
export function isValidPostalCode(postalCode: string): boolean {
  const re = /^[0-9]{5}(?:-[0-9]{4})?$/
  return re.test(postalCode)
}
export function isValidCreditCard(cardNumber: string): boolean {
  const re = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
  return re.test(cardNumber)
}
export function isValidUUID(uuid: string): boolean {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return re.test(uuid)
}
export function isValidHexColor(hex: string): boolean {
  const re = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
  return re.test(hex)
}
export function isValidIP(ip: string): boolean {
  const re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return re.test(ip)
}
export function isValidMacAddress(mac: string): boolean {
  const re = /^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/i
  return re.test(mac)
}
export function isValidISBN(isbn: string): boolean {
  const re = /^(97(8|9))?\d{9}(\d|X)$/
  return re.test(isbn)
}
export function isValidSSN(ssn: string): boolean {
  const re = /^\d{3}-\d{2}-\d{4}$/
  return re.test(ssn)
}
export function isValidLicensePlate(plate: string): boolean {
  const re = /^[A-Z0-9]{1,7}$/
  return re.test(plate)
}
export function isValidUsername(username: string): boolean {
  const re = /^[a-zA-Z0-9._-]{3,20}$/
  return re.test(username)
}
export function isValidPassword(password: string): boolean {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
  return re.test(password)
}
export function isValidSlug(slug: string): boolean {
  const re = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return re.test(slug)
}
export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
