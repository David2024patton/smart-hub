import { en } from './en'

export type Locale = typeof en

const locales: Record<string, Locale> = { en }

let currentLocale: string = 'en'

export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.')
  let val: any = locales[currentLocale]
  for (const key of keys) {
    val = val?.[key]
  }
  if (typeof val !== 'string') return path
  if (!params) return val
  return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''))
}

export function setLocale(locale: string) {
  if (locales[locale]) currentLocale = locale
}

export function getLocale() {
  return currentLocale
}

export function registerLocale(code: string, locale: Locale) {
  locales[code] = locale
}
