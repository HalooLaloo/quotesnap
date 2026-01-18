// Typy dla QuoteSnap

export interface Service {
  id: string
  user_id: string
  name: string
  unit: 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt'
  price: number
  created_at: string
}

export interface QuoteRequest {
  id: string
  contractor_id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  address: string | null
  description: string
  photos: string[]
  status: 'new' | 'reviewing' | 'quoted' | 'accepted' | 'rejected'
  token: string
  created_at: string
}

export interface QuoteItem {
  service_name: string
  quantity: number
  unit: string
  unit_price: number
  total: number
}

export interface QuoteMaterial {
  name: string
  quantity: number
  unit_price: number
  total: number
}

export interface Quote {
  id: string
  request_id: string
  user_id: string
  items: QuoteItem[]
  materials: QuoteMaterial[]
  subtotal: number
  discount_percent: number
  total: number
  notes: string | null
  valid_until: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  token: string
  sent_at: string | null
  accepted_at: string | null
  created_at: string
}

// Jednostki z etykietami
export const UNITS: Record<Service['unit'], string> = {
  m2: 'm²',
  mb: 'mb',
  szt: 'szt.',
  godz: 'godz.',
  ryczalt: 'ryczałt',
}
