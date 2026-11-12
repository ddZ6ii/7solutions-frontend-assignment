import { useId } from 'react'

import { ItemList } from '@/components/item-list'
import type { Item, ItemType } from '@/types/item'

type TypeColumnProps = {
  type: ItemType
  items: readonly Item[]
  onItemClick: (item: Item) => void
}

export function TypeColumn({ type, items, onItemClick }: TypeColumnProps) {
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
      <ItemList items={items} onItemClick={onItemClick} />
    </section>
  )
}
