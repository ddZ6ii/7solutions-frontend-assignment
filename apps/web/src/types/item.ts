const ITEM_TYPES = ['fruit', 'vegetable'] as const

type ItemType = (typeof ITEM_TYPES)[number]

type Item = {
  type: ItemType
  name: string
}

export { ITEM_TYPES, type ItemType, type Item }
