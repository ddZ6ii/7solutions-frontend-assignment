import { ItemButton } from '@/components/item-button'
import type { Item } from '@/types/item'

type ItemListProps = {
  items: readonly Item[]
  onItemClick: (item: Item) => void
}

export function ItemList({ items, onItemClick }: ItemListProps) {
  return (
    <ul className="grid h-full grid-cols-[repeat(auto-fit,minmax(min(8rem,100%),1fr))] content-start gap-2 overflow-y-auto px-2 py-2 lg:grid-cols-1 lg:gap-4 lg:px-4">
      {items.map((item) => (
        <li key={item.name}>
          <ItemButton item={item} onClick={onItemClick} />
        </li>
      ))}
    </ul>
  )
}
