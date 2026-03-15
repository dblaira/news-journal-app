import { readFileSync } from 'fs'
import { join } from 'path'
import { NormalizedRecord } from './types'
import { parseCSV } from './csv-utils'

const KEEP_FIELDS_PHYSICAL = [
  'Order Date', 'Product Name', 'Unit Price', 'Total Amount',
  'Quantity', 'Product Condition', 'Shipping Address', 'Order Status',
  'Original Quantity', 'Total Discounts',
]

const KEEP_FIELDS_DIGITAL = [
  'Order Date', 'Product Name', 'Price', 'Transaction Amount',
  'Publisher', 'Marketplace', 'Quantity Ordered',
]

function parsePhysicalOrders(basePath: string): NormalizedRecord[] {
  const filePath = join(basePath, 'Order History.csv')
  const raw = readFileSync(filePath, 'utf-8')
  const rows = parseCSV(raw)

  const records: NormalizedRecord[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const orderDate = row['Order Date']
    const productName = row['Product Name']
    if (!orderDate || !productName) continue

    const dedupeKey = `${orderDate}::${productName}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const content: Record<string, string | number | boolean> = {}
    for (const field of KEEP_FIELDS_PHYSICAL) {
      const val = row[field]
      if (val && val !== 'Not Available' && val !== 'Not Applicable') {
        const num = parseFloat(val)
        if (field.includes('Price') || field.includes('Amount') || field.includes('Discount')) {
          content[field.toLowerCase().replace(/ /g, '_')] = isNaN(num) ? val : num
        } else if (field === 'Quantity' || field === 'Original Quantity') {
          content[field.toLowerCase().replace(/ /g, '_')] = isNaN(num) ? val : num
        } else {
          content[field.toLowerCase().replace(/ /g, '_')] = val
        }
      }
    }
    content.order_type = 'physical'

    records.push({
      timestamp: new Date(orderDate).toISOString(),
      source_domain: 'amazon',
      content,
    })
  }

  return records
}

function parseDigitalOrders(basePath: string): NormalizedRecord[] {
  const filePath = join(basePath, 'Digital Content Orders.csv')
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    console.log('  No Digital Content Orders.csv found, skipping.')
    return []
  }
  const rows = parseCSV(raw)

  const records: NormalizedRecord[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const orderDate = row['Order Date']
    const productName = row['Product Name']
    if (!orderDate || !productName) continue

    if (row['Component Type'] === 'Tax') continue

    const dedupeKey = `${orderDate}::${productName}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const content: Record<string, string | number | boolean> = {}
    for (const field of KEEP_FIELDS_DIGITAL) {
      const val = row[field]
      if (val && val !== 'Not Available' && val !== 'Not Applicable') {
        const num = parseFloat(val)
        if (field === 'Price' || field === 'Transaction Amount') {
          content[field.toLowerCase().replace(/ /g, '_')] = isNaN(num) ? val : num
        } else if (field === 'Quantity Ordered') {
          content['quantity'] = isNaN(num) ? val : num
        } else {
          content[field.toLowerCase().replace(/ /g, '_')] = val
        }
      }
    }
    content.order_type = 'digital'

    const marketplace = row['Marketplace'] || ''
    if (marketplace.includes('audible')) content.content_type = 'audiobook'
    else if (marketplace.includes('kindle')) content.content_type = 'ebook'
    else content.content_type = 'digital'

    records.push({
      timestamp: new Date(orderDate).toISOString(),
      source_domain: 'amazon',
      content,
    })
  }

  return records
}

export function parseAmazon(projectRoot: string): NormalizedRecord[] {
  const basePath = join(projectRoot, 'Feb_Metadata/Your Orders-2/Your Amazon Orders')

  console.log('  Parsing physical orders...')
  const physical = parsePhysicalOrders(basePath)
  console.log(`  Found ${physical.length} physical order records.`)

  console.log('  Parsing digital orders...')
  const digital = parseDigitalOrders(basePath)
  console.log(`  Found ${digital.length} digital order records.`)

  const all = [...physical, ...digital].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  console.log(`  Total Amazon records: ${all.length}`)
  if (all.length > 0) {
    console.log(`  Date range: ${all[0].timestamp.slice(0, 10)} to ${all[all.length - 1].timestamp.slice(0, 10)}`)
  }

  return all
}
