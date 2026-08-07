'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  BASE_CURRENCY,
  formatMoney,
  toBase,
  toCurrencyCode,
  type CurrencyCode,
} from '@/lib/currency'
import { format } from 'date-fns'

interface EstimateItem {
  description: string
  type: string
  quantity: number
  unit_price: number
  total: number
}

interface EstimatePDFData {
  estimate_number: string
  status: string
  created_at: string
  valid_until?: string
  notes?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  /** Currency the amounts were recorded in. Defaults to the base currency. */
  currency?: CurrencyCode | string
  /** Rate in force when the invoice was written, as units per 1 EUR. */
  exchange_rate?: number
  items: EstimateItem[]
  customer?: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
  vehicle?: {
    make: string
    model: string
    year: number
    license_plate?: string
    vin?: string
  }
  shop?: {
    name: string
    address?: string
    phone?: string
    email?: string
  }
}

export function generateEstimatePDF(data: EstimatePDFData, logoDataUrl?: string): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // The PDF is the customer-facing document, so it must print the currency the
  // invoice was actually written in rather than the shop's current setting.
  const currency = toCurrencyCode(data.currency)
  const rawRate = Number(data.exchange_rate)
  const rate = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1
  const money = (amount: number | null | undefined) => formatMoney(amount, currency)
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246] // Blue
  const darkColor: [number, number, number] = [31, 41, 55]
  const grayColor: [number, number, number] = [107, 114, 128]
  
  let yPos = 20

  // Brand logo (if available) above the shop name
  if (logoDataUrl) {
    // Logo aspect ratio ~ 3.2:1; render at 40mm wide
    doc.addImage(logoDataUrl, 'PNG', 20, yPos - 6, 40, 12.5)
    yPos += 12
  }

  // Header with shop info
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text(data.shop?.name || 'Auto Shop', 20, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  if (data.shop?.address) {
    doc.text(data.shop.address, 20, yPos)
    yPos += 5
  }
  if (data.shop?.phone) {
    doc.text(`Tel: ${data.shop.phone}`, 20, yPos)
    yPos += 5
  }
  if (data.shop?.email) {
    doc.text(data.shop.email, 20, yPos)
  }

  // Estimate title and number (right side)
  doc.setFontSize(28)
  doc.setTextColor(...darkColor)
  doc.setFont('helvetica', 'bold')
  doc.text('ESTIMATE', pageWidth - 20, 25, { align: 'right' })
  
  doc.setFontSize(12)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${data.estimate_number}`, pageWidth - 20, 33, { align: 'right' })
  
  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    draft: [107, 114, 128],
    sent: [59, 130, 246],
    approved: [34, 197, 94],
    rejected: [239, 68, 68],
    expired: [249, 115, 22],
  }
  const statusColor = statusColors[data.status] || grayColor
  doc.setFontSize(10)
  doc.setTextColor(...statusColor)
  doc.setFont('helvetica', 'bold')
  doc.text(data.status.toUpperCase(), pageWidth - 20, 41, { align: 'right' })

  // Divider line
  yPos = 55
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, yPos, pageWidth - 20, yPos)

  yPos += 15

  // Two column layout for customer and vehicle info
  const colWidth = (pageWidth - 60) / 2
  
  // Customer Info (left column)
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', 20, yPos)
  
  yPos += 7
  doc.setFontSize(10)
  doc.setTextColor(...darkColor)
  doc.setFont('helvetica', 'normal')
  
  if (data.customer) {
    doc.setFont('helvetica', 'bold')
    doc.text(data.customer.name, 20, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 5
    if (data.customer.email) {
      doc.text(data.customer.email, 20, yPos)
      yPos += 5
    }
    if (data.customer.phone) {
      doc.text(data.customer.phone, 20, yPos)
      yPos += 5
    }
    if (data.customer.address) {
      doc.text(data.customer.address, 20, yPos)
    }
  } else {
    doc.text('No customer assigned', 20, yPos)
  }

  // Vehicle Info (right column)
  let rightYPos = yPos - (data.customer ? 17 : 0)
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('VEHICLE', 20 + colWidth + 20, rightYPos)
  
  rightYPos += 7
  doc.setFontSize(10)
  doc.setTextColor(...darkColor)
  doc.setFont('helvetica', 'normal')
  
  if (data.vehicle) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`, 20 + colWidth + 20, rightYPos)
    doc.setFont('helvetica', 'normal')
    rightYPos += 5
    if (data.vehicle.license_plate) {
      doc.text(`Plate: ${data.vehicle.license_plate}`, 20 + colWidth + 20, rightYPos)
      rightYPos += 5
    }
    if (data.vehicle.vin) {
      doc.text(`VIN: ${data.vehicle.vin}`, 20 + colWidth + 20, rightYPos)
    }
  } else {
    doc.text('No vehicle assigned', 20 + colWidth + 20, rightYPos)
  }

  // Dates section
  yPos = Math.max(yPos, rightYPos) + 15
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text(`Date: ${format(new Date(data.created_at), 'MMMM d, yyyy')}`, 20, yPos)
  if (data.valid_until) {
    doc.text(`Valid Until: ${format(new Date(data.valid_until), 'MMMM d, yyyy')}`, 20 + colWidth + 20, yPos)
  }

  yPos += 15

  // Items table
  const tableData = data.items.map(item => [
    item.description,
    item.type === 'parts' ? 'Parts' : 'Labor',
    item.quantity.toString(),
    money(item.unit_price),
    money(item.total),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Type', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
    didDrawPage: () => {
      // Footer on each page
      doc.setFontSize(8)
      doc.setTextColor(...grayColor)
      doc.text(
        'Thank you for your business!',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    },
  })

  // Get the Y position after the table
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Totals section (right aligned)
  const totalsX = pageWidth - 80
  let totalsY = finalY

  doc.setFontSize(10)
  doc.setTextColor(...grayColor)
  doc.text('Subtotal:', totalsX, totalsY)
  doc.setTextColor(...darkColor)
  doc.text(money(data.subtotal), pageWidth - 20, totalsY, { align: 'right' })
  
  totalsY += 7
  doc.setTextColor(...grayColor)
  doc.text(`Tax (${data.tax_rate}%):`, totalsX, totalsY)
  doc.setTextColor(...darkColor)
  doc.text(money(data.tax_amount), pageWidth - 20, totalsY, { align: 'right' })
  
  totalsY += 10
  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.3)
  doc.line(totalsX - 10, totalsY - 3, pageWidth - 20, totalsY - 3)
  
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalsX, totalsY + 5)
  doc.text(money(data.total), pageWidth - 20, totalsY + 5, { align: 'right' })

  // For a non-base currency, print the euro equivalent and the rate used, so
  // the customer can audit the conversion on the document itself.
  if (currency !== BASE_CURRENCY) {
    totalsY += 11
    doc.setFontSize(8)
    doc.setTextColor(...grayColor)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${formatMoney(toBase(data.total, currency, rate), BASE_CURRENCY)}  (1 ${BASE_CURRENCY} = ${rate} ${currency})`,
      pageWidth - 20,
      totalsY + 5,
      { align: 'right' },
    )
  }

  // Notes section
  if (data.notes) {
    totalsY += 25
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', 20, totalsY)
    
    totalsY += 7
    doc.setFontSize(9)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'normal')
    
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40)
    doc.text(splitNotes, 20, totalsY)
  }

  return doc
}

async function loadLogoDataUrl(): Promise<string | undefined> {
  try {
    const res = await fetch('/brand/fiivoo-logo-black.png')
    if (!res.ok) return undefined
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(undefined)
      reader.readAsDataURL(blob)
    })
  } catch {
    return undefined
  }
}

export async function downloadEstimatePDF(data: EstimatePDFData): Promise<void> {
  const logoDataUrl = await loadLogoDataUrl()
  const doc = generateEstimatePDF(data, logoDataUrl)
  doc.save(`estimate-${data.estimate_number}.pdf`)
}
