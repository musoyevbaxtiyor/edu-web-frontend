import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx (401 / 403 / 404) qayta urinish bilan tuzalmaydi — faqat tarmoq / 5xx xatolarida bir marta
      retry: (count, error) => !(error?.status >= 400 && error?.status < 500) && count < 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
