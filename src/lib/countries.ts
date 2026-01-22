// Country configurations for BrickQuote
// Supports English-speaking markets initially

export interface CountryConfig {
  code: string
  name: string
  currency: string
  currencySymbol: string
  taxLabel: string
  defaultTaxPercent: number
  taxIdLabel: string
  taxIdRequired: boolean
  taxIdPlaceholder: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY'
}

export const COUNTRIES: Record<string, CountryConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    taxLabel: 'Sales Tax',
    defaultTaxPercent: 0,
    taxIdLabel: 'Tax ID (EIN)',
    taxIdRequired: false,
    taxIdPlaceholder: 'XX-XXXXXXX',
    dateFormat: 'MM/DD/YYYY',
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    taxLabel: 'VAT',
    defaultTaxPercent: 20,
    taxIdLabel: 'VAT Number',
    taxIdRequired: true,
    taxIdPlaceholder: 'GB123456789',
    dateFormat: 'DD/MM/YYYY',
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    taxLabel: 'GST',
    defaultTaxPercent: 10,
    taxIdLabel: 'ABN',
    taxIdRequired: true,
    taxIdPlaceholder: 'XX XXX XXX XXX',
    dateFormat: 'DD/MM/YYYY',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    taxLabel: 'GST/HST',
    defaultTaxPercent: 5,
    taxIdLabel: 'GST/HST Number',
    taxIdRequired: false,
    taxIdPlaceholder: '123456789RT0001',
    dateFormat: 'DD/MM/YYYY',
  },
  IE: {
    code: 'IE',
    name: 'Ireland',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'VAT',
    defaultTaxPercent: 23,
    taxIdLabel: 'VAT Number',
    taxIdRequired: true,
    taxIdPlaceholder: 'IE1234567X',
    dateFormat: 'DD/MM/YYYY',
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    currency: 'NZD',
    currencySymbol: 'NZ$',
    taxLabel: 'GST',
    defaultTaxPercent: 15,
    taxIdLabel: 'GST Number',
    taxIdRequired: false,
    taxIdPlaceholder: 'XXX-XXX-XXX',
    dateFormat: 'DD/MM/YYYY',
  },
}

// Helper to get country list for dropdowns
export const COUNTRY_LIST = Object.values(COUNTRIES).map(c => ({
  code: c.code,
  name: c.name,
}))

// Helper to format currency
export function formatCurrency(amount: number, countryCode: string): string {
  const country = COUNTRIES[countryCode] || COUNTRIES.US
  return `${country.currencySymbol}${amount.toFixed(2)}`
}

// Helper to format date based on country
export function formatDate(date: Date | string, countryCode: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const country = COUNTRIES[countryCode] || COUNTRIES.US

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()

  if (country.dateFormat === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`
  }
  return `${day}/${month}/${year}`
}

// Get default country (US)
export const DEFAULT_COUNTRY = 'US'
