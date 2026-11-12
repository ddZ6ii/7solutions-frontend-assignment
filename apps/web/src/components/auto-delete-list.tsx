import { BoardLayout } from '@/components/board-layout'
import { ItemList } from '@/components/item-list'
import { TypeColumn } from '@/components/type-column'
import { AUTO_DELETE_DELAY_MS, useAutoDelete } from '@/hooks/use-auto-delete'
import { useMoveFeedback } from '@/hooks/use-move-feedback'
import { ITEM_TYPES } from '@/types/item'

export function AutoDeleteList() {
  const { announcement, onMove } = useMoveFeedback()
  const { state, moveItem } = useAutoDelete({ onMove })

  return (
    <>
      <BoardLayout>
        <section aria-labelledby="main-list-heading" className="min-h-0">
          <h2 id="main-list-heading" className="sr-only">
            Items
          </h2>
          <p className="sr-only">
            Select an item to move it to its type column. It comes back after{' '}
            {AUTO_DELETE_DELAY_MS / 1000} seconds, or select it again to bring
            it back now.
          </p>
          <ItemList
            items={state.main}
            getActionLabel={(item) => `move to ${item.type}`}
            onItemClick={moveItem}
          />
        </section>

        {ITEM_TYPES.map((type) => (
          <TypeColumn key={type} type={type}>
            <ItemList
              items={state[type]}
              getActionLabel={() => 'move back to the list'}
              onItemClick={moveItem}
            />
          </TypeColumn>
        ))}
      </BoardLayout>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  )
}
