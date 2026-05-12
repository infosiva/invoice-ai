import { redirect } from 'next/navigation'

export default function DealPage({ params }: { params: { id: string } }) {
  redirect(`/deal/${params.id}/scope`)
}
