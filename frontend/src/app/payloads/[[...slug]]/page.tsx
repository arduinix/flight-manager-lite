export async function generateStaticParams() {
  // Return a placeholder entry for static export
  // Actual routing is handled client-side
  return [{ slug: [] }]
}

import dynamic from 'next/dynamic'

const PayloadsRouter = dynamic(() => import('./PayloadsRouter'), { ssr: false })

export default function PayloadsPage() {
  return <PayloadsRouter />
}
