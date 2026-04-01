'use client'

import { type RefObject } from 'react'
import * as XLSX from 'xlsx'

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  brand: string | null
  description: string | null
  price_pence: number
  cost_price_pence: number | null
  compare_at_price_pence: number | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  unit: string | null
  weight_grams: number | null
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100) + '-' + Date.now().toString(36)
}

function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function exportProducts(
  products: Product[],
  setExporting: (v: boolean) => void
) {
  setExporting(true)
  try {
    const exportData = products.map((product) => ({
      'Name': product.name,
      'SKU': product.sku || '',
      'Brand': product.brand || '',
      'Description': product.description || '',
      'Price (\u00a3)': (product.price_pence / 100).toFixed(2),
      'Cost Price (\u00a3)': product.cost_price_pence ? (product.cost_price_pence / 100).toFixed(2) : '',
      'Compare At Price (\u00a3)': product.compare_at_price_pence ? (product.compare_at_price_pence / 100).toFixed(2) : '',
      'Stock Quantity': product.stock_quantity,
      'Low Stock Threshold': product.low_stock_threshold,
      'Track Inventory': product.track_inventory ? 'Yes' : 'No',
      'Unit': product.unit || '',
      'Weight (g)': product.weight_grams || '',
      'Active': product.is_active ? 'Yes' : 'No',
      'Featured': product.is_featured ? 'Yes' : 'No',
      'Image URL': product.image_url || '',
      'Slug': product.slug,
      'ID': product.id,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 50 },
      { wch: 25 }, { wch: 40 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `products_export_${date}.xlsx`)
  } catch (error) {
    console.error('Export error:', error)
    alert('Failed to export products')
  }
  setExporting(false)
}

export async function importProducts(
  e: React.ChangeEvent<HTMLInputElement>,
  setImporting: (v: boolean) => void,
  refreshProducts: () => Promise<void>,
  fileInputRef: RefObject<HTMLInputElement | null>
) {
  const file = e.target.files?.[0]
  if (!file) return
  setImporting(true)
  try {
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        if (jsonData.length === 0) { alert('No data found in the Excel file'); setImporting(false); return }
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []
        for (const row of jsonData as Record<string, unknown>[]) {
          try {
            const name = row['Name'] as string
            if (!name) { errors.push('Row skipped: Missing product name'); errorCount++; continue }
            const pricePounds = parseFloat(String(row['Price (\u00a3)'] || '0').replace('\u00a3', ''))
            const costPricePounds = parseFloat(String(row['Cost Price (\u00a3)'] || '0').replace('\u00a3', ''))
            const compareAtPricePounds = parseFloat(String(row['Compare At Price (\u00a3)'] || '0').replace('\u00a3', ''))
            const existingId = row['ID'] as string
            const existingSlug = row['Slug'] as string
            const productData: Record<string, unknown> = {
              name, sku: row['SKU'] || null, brand: row['Brand'] || null,
              description: row['Description'] || null,
              price_pence: Math.round(pricePounds * 100) || 0,
              cost_price_pence: costPricePounds ? Math.round(costPricePounds * 100) : null,
              compare_at_price_pence: compareAtPricePounds ? Math.round(compareAtPricePounds * 100) : null,
              stock_quantity: parseInt(String(row['Stock Quantity'] || '0')) || 0,
              low_stock_threshold: parseInt(String(row['Low Stock Threshold'] || '5')) || 5,
              track_inventory: String(row['Track Inventory']).toLowerCase() === 'yes',
              unit: row['Unit'] || null,
              weight_grams: row['Weight (g)'] ? parseInt(String(row['Weight (g)'])) : null,
              is_active: String(row['Active']).toLowerCase() !== 'no',
              is_featured: String(row['Featured']).toLowerCase() === 'yes',
              image_url: row['Image URL'] || null,
            }
            if (!existingId) { productData.slug = existingSlug || generateSlug(name) }
            if (existingId) {
              const response = await fetch(`/api/products/${existingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) })
              if (response.ok) { successCount++ } else { const errData = await response.json(); errors.push(`Update failed "${name}": ${errData.error || 'Unknown error'}`); errorCount++ }
            } else {
              const response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) })
              if (response.ok) { successCount++ } else { const errData = await response.json(); errors.push(`Create failed "${name}": ${errData.error || 'Unknown error'}`); errorCount++ }
            }
          } catch (err) { errorCount++; errors.push(`Error processing row: ${err}`) }
        }
        let message = `Import completed!\n\nSuccessful: ${successCount}\nErrors: ${errorCount}`
        if (errors.length > 0 && errors.length <= 10) { message += `\n\nErrors:\n${errors.join('\n')}` }
        else if (errors.length > 10) { message += `\n\nFirst 10 errors:\n${errors.slice(0, 10).join('\n')}` }
        alert(message)
        await refreshProducts()
      } catch (err) { console.error('Import processing error:', err); alert('Failed to process Excel file: ' + err) }
      setImporting(false)
    }
    reader.onerror = () => { alert('Failed to read file'); setImporting(false) }
    reader.readAsBinaryString(file)
  } catch (error) { console.error('Import error:', error); alert('Failed to import products'); setImporting(false) }
  if (fileInputRef.current) { fileInputRef.current.value = '' }
}

export function downloadTemplate() {
  const templateData = [{
    'Name': 'Example Product', 'SKU': 'SKU-001', 'Brand': 'Brand Name',
    'Description': 'Product description here', 'Price (\u00a3)': '9.99',
    'Cost Price (\u00a3)': '5.00', 'Compare At Price (\u00a3)': '12.99',
    'Stock Quantity': 100, 'Low Stock Threshold': 10, 'Track Inventory': 'Yes',
    'Unit': 'each', 'Weight (g)': 500, 'Active': 'Yes', 'Featured': 'No',
    'Image URL': 'https://example.com/image.jpg',
  }]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(templateData)
  ws['!cols'] = [
    { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 12 },
    { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 50 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Products Template')
  XLSX.writeFile(wb, 'products_import_template.xlsx')
}

export async function bulkImageUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  products: Product[],
  setBulkUploading: (v: boolean) => void,
  setBulkUploadResults: (r: { matched: number; notFound: string[]; total: number } | null) => void,
  refreshProducts: () => Promise<void>,
  bulkImageInputRef: RefObject<HTMLInputElement | null>
) {
  const files = e.target.files
  if (!files || files.length === 0) return
  setBulkUploading(true)
  setBulkUploadResults(null)
  const results = { matched: 0, notFound: [] as string[], total: files.length }
  try {
    for (const file of Array.from(files)) {
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      const normalizedFileName = normalizeForMatch(fileName)
      const matchedProduct = products.find(p => {
        const normalizedProductName = normalizeForMatch(p.name)
        return normalizedProductName === normalizedFileName ||
               normalizedProductName.includes(normalizedFileName) ||
               normalizedFileName.includes(normalizedProductName)
      })
      if (matchedProduct) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          const updateRes = await fetch(`/api/products/${matchedProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: url }) })
          if (updateRes.ok) { results.matched++ } else { results.notFound.push(`${fileName} (upload failed)`) }
        } else { results.notFound.push(`${fileName} (upload failed)`) }
      } else { results.notFound.push(fileName) }
    }
    setBulkUploadResults(results)
    await refreshProducts()
  } catch (error) { console.error('Bulk upload error:', error); alert('Bulk upload failed') }
  setBulkUploading(false)
  if (bulkImageInputRef.current) { bulkImageInputRef.current.value = '' }
}
