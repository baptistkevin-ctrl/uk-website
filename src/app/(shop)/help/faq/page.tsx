import { redirect } from 'next/navigation'

// Redirect FAQ to main help page which has comprehensive FAQs
export default function FAQPage() {
  redirect('/help')
}
