import { TrackingView } from './TrackingView'

export const metadata = { title: 'Track Your Order' }

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TrackingView orderId={id} />
}
