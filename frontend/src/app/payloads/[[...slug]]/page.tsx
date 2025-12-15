import dynamic from 'next/dynamic'

const PayloadsRouter = dynamic(() => import('./PayloadsRouter'), { ssr: false })

// generateStaticParams only needed for static export (production build)
// In dev mode, Next.js handles dynamic routes automatically
export async function generateStaticParams() {
  return [{ slug: [] }]
}

export default function PayloadsPage() {
  return <PayloadsRouter />
}
