import { GridLayout } from '@/components/grid-layout'
import { ItemList } from '@/components/item-list'

export function AutoDeleteList() {
  return (
    <GridLayout>
      <ItemList />
      <div className="grid bg-emerald-500">Fruits</div>
      <div className="grid bg-pink-500">Vegetables</div>
    </GridLayout>
  )
}
