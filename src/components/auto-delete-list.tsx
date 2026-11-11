import { BoardLayout } from '@/components/board-layout'
import { ItemList } from '@/components/item-list'
import { TypeColumn } from '@/components/type-column'
import { ITEM_TYPES } from '@/data/item-types'
import { ITEMS } from '@/data/items'

export function AutoDeleteList() {
  return (
    <BoardLayout>
      <section aria-labelledby="main-list-heading" className="min-h-0">
        <h2 id="main-list-heading" className="sr-only">
          Items
        </h2>
        <ItemList items={ITEMS} />
      </section>

      {ITEM_TYPES.map((type) => (
        <TypeColumn
          key={type}
          type={type}
          items={ITEMS.filter((item) => item.type === type)}
        />
      ))}
    </BoardLayout>
  )
}
