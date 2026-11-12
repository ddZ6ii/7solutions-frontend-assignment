import { BoardLayout } from '@/components/board-layout'
import { ItemList } from '@/components/item-list'
import { TypeColumn } from '@/components/type-column'
import { useAutoDelete } from '@/hooks/use-auto-delete'
import { ITEM_TYPES } from '@/types/item'

export function AutoDeleteList() {
  const { state, moveItem } = useAutoDelete()

  return (
    <BoardLayout>
      <section aria-labelledby="main-list-heading" className="min-h-0">
        <h2 id="main-list-heading" className="sr-only">
          Items
        </h2>
        <ItemList items={state.main} onItemClick={moveItem} />
      </section>

      {ITEM_TYPES.map((type) => (
        <TypeColumn key={type} type={type}>
          <ItemList items={state[type]} onItemClick={moveItem} />
        </TypeColumn>
      ))}
    </BoardLayout>
  )
}
