import type { ITEM_TYPES } from '@/data/item-types'

type ItemType = (typeof ITEM_TYPES)[number]

type Item = {
  type: ItemType
  name: string
}

export { type ItemType, type Item }
