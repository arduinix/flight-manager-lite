'use client'

import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const PayloadsListClient = dynamic(() => import('./PayloadsListClient'), { ssr: false })
const FlightsClient = dynamic(() => import('./FlightsClient'), { ssr: false })

export default function PayloadsRouter() {
  const params = useParams()
  const slug = (params.slug as string[] | undefined) || []
  
  // If slug is empty, show payloads list; otherwise show flights page
  if (slug.length === 0) {
    return <PayloadsListClient />
  }
  
  return <FlightsClient />
}

