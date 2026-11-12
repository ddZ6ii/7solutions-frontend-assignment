import type { Item } from '@/types/item'

type ItemButtonProps = {
  item: Item
  /** Screen-reader-only description of what clicking does, e.g. "move to fruit" */
  actionLabel: string
  onClick: (item: Item) => void
}

export function ItemButton({ item, actionLabel, onClick }: ItemButtonProps) {
  return (
    <button
      type="button"
      data-item={item.name}
      onClick={() => onClick(item)}
      className="w-full cursor-pointer rounded-sm border border-gray-500 bg-[#fefefe] px-1 py-2 text-sm transition-colors hover:bg-[#f8f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 lg:p-2 lg:text-base"
    >
      {item.name}
      <span className="sr-only">, {actionLabel}</span>
    </button>
  )
}
