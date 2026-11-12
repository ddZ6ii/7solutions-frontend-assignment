import type { ReactNode } from 'react'

type BoardLayoutProps = { children: ReactNode }

export function BoardLayout({ children }: BoardLayoutProps) {
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr_1fr] gap-4 py-2 lg:grid-cols-3 lg:grid-rows-1 lg:gap-8 lg:py-8">
      {children}
    </div>
  )
}
