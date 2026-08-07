import { enUS, sq, de, es, fr, it } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

/**
 * Printed strings for the estimate PDF.
 *
 * These live here rather than in `messages/*.json` on purpose: next-intl only
 * loads the *active* locale into the client bundle, but the PDF button lets the
 * user print in any language on demand. Keeping this small set inline means
 * every language is always available without refetching messages.
 *
 * Only Latin-1 characters are used, since jsPDF's built-in Helvetica cannot
 * render glyphs outside that range without embedding a custom font.
 */
export interface PdfLabels {
  title: string
  billTo: string
  vehicle: string
  noCustomer: string
  noVehicle: string
  plate: string
  vin: string
  date: string
  validUntil: string
  description: string
  type: string
  qty: string
  unitPrice: string
  lineTotal: string
  parts: string
  labor: string
  subtotal: string
  tax: string
  total: string
  notes: string
  thankYou: string
  statuses: Record<string, string>
}

const LABELS: Record<Locale, PdfLabels> = {
  en: {
    title: 'ESTIMATE',
    billTo: 'BILL TO',
    vehicle: 'VEHICLE',
    noCustomer: 'No customer assigned',
    noVehicle: 'No vehicle assigned',
    plate: 'Plate',
    vin: 'VIN',
    date: 'Date',
    validUntil: 'Valid Until',
    description: 'Description',
    type: 'Type',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    lineTotal: 'Total',
    parts: 'Parts',
    labor: 'Labor',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'TOTAL',
    notes: 'Notes',
    thankYou: 'Thank you for your business!',
    statuses: {
      draft: 'DRAFT',
      sent: 'SENT',
      approved: 'APPROVED',
      rejected: 'REJECTED',
      expired: 'EXPIRED',
    },
  },
  sq: {
    title: 'FATURË',
    billTo: 'FATURUAR PËR',
    vehicle: 'AUTOMJETI',
    noCustomer: 'Nuk ka klient të caktuar',
    noVehicle: 'Nuk ka automjet të caktuar',
    plate: 'Targa',
    vin: 'VIN',
    date: 'Data',
    validUntil: 'E vlefshme deri',
    description: 'Përshkrimi',
    type: 'Tipi',
    qty: 'Sasia',
    unitPrice: 'Çmimi njësi',
    lineTotal: 'Totali',
    parts: 'Pjesë',
    labor: 'Punë',
    subtotal: 'Nëntotali',
    tax: 'TVSH',
    total: 'TOTALI',
    notes: 'Shënime',
    thankYou: 'Faleminderit për besimin!',
    statuses: {
      draft: 'DRAFT',
      sent: 'DËRGUAR',
      approved: 'MIRATUAR',
      rejected: 'REFUZUAR',
      expired: 'SKADUAR',
    },
  },
  de: {
    title: 'KOSTENSCHÄTZUNG',
    billTo: 'RECHNUNG AN',
    vehicle: 'FAHRZEUG',
    noCustomer: 'Kein Kunde zugewiesen',
    noVehicle: 'Kein Fahrzeug zugewiesen',
    plate: 'Kennzeichen',
    vin: 'FIN',
    date: 'Datum',
    validUntil: 'Gültig bis',
    description: 'Beschreibung',
    type: 'Art',
    qty: 'Menge',
    unitPrice: 'Einzelpreis',
    lineTotal: 'Gesamt',
    parts: 'Teile',
    labor: 'Arbeit',
    subtotal: 'Zwischensumme',
    tax: 'MwSt.',
    total: 'GESAMT',
    notes: 'Anmerkungen',
    thankYou: 'Vielen Dank für Ihren Auftrag!',
    statuses: {
      draft: 'ENTWURF',
      sent: 'GESENDET',
      approved: 'GENEHMIGT',
      rejected: 'ABGELEHNT',
      expired: 'ABGELAUFEN',
    },
  },
  es: {
    title: 'PRESUPUESTO',
    billTo: 'FACTURAR A',
    vehicle: 'VEHÍCULO',
    noCustomer: 'Sin cliente asignado',
    noVehicle: 'Sin vehículo asignado',
    plate: 'Matrícula',
    vin: 'VIN',
    date: 'Fecha',
    validUntil: 'Válido hasta',
    description: 'Descripción',
    type: 'Tipo',
    qty: 'Cant.',
    unitPrice: 'Precio unit.',
    lineTotal: 'Total',
    parts: 'Piezas',
    labor: 'Mano de obra',
    subtotal: 'Subtotal',
    tax: 'IVA',
    total: 'TOTAL',
    notes: 'Notas',
    thankYou: '¡Gracias por su confianza!',
    statuses: {
      draft: 'BORRADOR',
      sent: 'ENVIADO',
      approved: 'APROBADO',
      rejected: 'RECHAZADO',
      expired: 'CADUCADO',
    },
  },
  fr: {
    title: 'DEVIS',
    billTo: 'FACTURER À',
    vehicle: 'VÉHICULE',
    noCustomer: 'Aucun client assigné',
    noVehicle: 'Aucun véhicule assigné',
    plate: 'Immatriculation',
    vin: 'VIN',
    date: 'Date',
    validUntil: "Valable jusqu'au",
    description: 'Description',
    type: 'Type',
    qty: 'Qté',
    unitPrice: 'Prix unitaire',
    lineTotal: 'Total',
    parts: 'Pièces',
    labor: "Main d'oeuvre",
    subtotal: 'Sous-total',
    tax: 'TVA',
    total: 'TOTAL',
    notes: 'Notes',
    thankYou: 'Merci de votre confiance !',
    statuses: {
      draft: 'BROUILLON',
      sent: 'ENVOYÉ',
      approved: 'APPROUVÉ',
      rejected: 'REFUSÉ',
      expired: 'EXPIRÉ',
    },
  },
  it: {
    title: 'PREVENTIVO',
    billTo: 'FATTURARE A',
    vehicle: 'VEICOLO',
    noCustomer: 'Nessun cliente assegnato',
    noVehicle: 'Nessun veicolo assegnato',
    plate: 'Targa',
    vin: 'VIN',
    date: 'Data',
    validUntil: 'Valido fino al',
    description: 'Descrizione',
    type: 'Tipo',
    qty: 'Qtà',
    unitPrice: 'Prezzo unit.',
    lineTotal: 'Totale',
    parts: 'Ricambi',
    labor: 'Manodopera',
    subtotal: 'Subtotale',
    tax: 'IVA',
    total: 'TOTALE',
    notes: 'Note',
    thankYou: 'Grazie per la fiducia!',
    statuses: {
      draft: 'BOZZA',
      sent: 'INVIATO',
      approved: 'APPROVATO',
      rejected: 'RIFIUTATO',
      expired: 'SCADUTO',
    },
  },
}

/** date-fns locales so printed dates read naturally in each language. */
const DATE_LOCALES: Record<Locale, DateFnsLocale> = { en: enUS, sq, de, es, fr, it }

/** Long date pattern per language: most of Europe leads with the day. */
const DATE_FORMATS: Record<Locale, string> = {
  en: 'MMMM d, yyyy',
  sq: 'd MMMM yyyy',
  de: 'd. MMMM yyyy',
  es: "d 'de' MMMM yyyy",
  fr: 'd MMMM yyyy',
  it: 'd MMMM yyyy',
}

export function getPdfLabels(locale: string | undefined): PdfLabels {
  return LABELS[(locale as Locale) ?? defaultLocale] ?? LABELS[defaultLocale]
}

export function getPdfDateLocale(locale: string | undefined): DateFnsLocale {
  return DATE_LOCALES[(locale as Locale) ?? defaultLocale] ?? DATE_LOCALES[defaultLocale]
}

export function getPdfDateFormat(locale: string | undefined): string {
  return DATE_FORMATS[(locale as Locale) ?? defaultLocale] ?? DATE_FORMATS[defaultLocale]
}
