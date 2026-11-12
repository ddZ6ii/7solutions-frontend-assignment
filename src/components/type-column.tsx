import { useId, type PropsWithChildren } from 'react'

import type { ItemType } from '@/types/item'

type TypeColumnProps = PropsWithChildren<{
  type: ItemType
}>

export function TypeColumn({ children, type }: TypeColumnProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="grid min-h-0 grid-rows-[auto_1fr] gap-2 rounded-sm border border-gray-300"
    >
      <h2
        id={headingId}
        className="border-b border-gray-300 bg-[#f2f3f5] py-1 text-center text-sm font-semibold capitalize lg:p-2 lg:text-lg"
      >
        {type}
      </h2>
      {children}
    </section>
  )
}
