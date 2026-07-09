import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/app/')({
  loader: async ({ params }) => {
    const locale = (params as { locale?: string }).locale || 'en'
    throw redirect({ to: '/{-$locale}/app/cinema/plaza', params: { locale } })
  },
  component: () => null,
})
