export async function generateStaticParams() {
  // Return a placeholder entry for static export
  // Actual routing is handled client-side
  return [{ slug: [''] }]
}

import dynamic from 'next/dynamic'

const FlightDetailClient = dynamic(() => import('./FlightDetailClient'), { ssr: false })

export default function FlightDetailPage() {
  return <FlightDetailClient />
}
