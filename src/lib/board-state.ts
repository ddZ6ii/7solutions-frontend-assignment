import { ITEMS } from '@/data/items'
import { ITEM_TYPES, type Item, type ItemType } from '@/types/item'

type ListKey = ItemType | 'main'
type State = Record<ListKey, Item[]>
type StateUpdater = (prev: State) => State

const initState = (): State => ({
  main: ITEMS,
  ...ITEM_TYPES.reduce(
    (acc, type) => ({ ...acc, [type]: [] }),
    {} as Record<ItemType, Item[]>,
  ),
})

const moveToMain =
  (item: Item): StateUpdater =>
  (prev) => ({
    ...prev,
    main: [...prev.main, item],
    [item.type]: prev[item.type].filter((i) => i.name !== item.name),
  })

const moveToColumn =
  (item: Item): StateUpdater =>
  (prev) => ({
    ...prev,
    main: prev.main.filter((i) => i.name !== item.name),
    [item.type]: [...prev[item.type], item],
  })

export { type ListKey, initState, moveToMain, moveToColumn }
