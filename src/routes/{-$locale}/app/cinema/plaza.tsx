import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/app/cinema/plaza')({
  loader: async ({ params }) => {
    const locale = (params as { locale?: string }).locale || 'en'
    throw redirect({ to: '/{-$locale}', params: { locale } })
  },
  component: () => null,
})
