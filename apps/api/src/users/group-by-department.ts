import { formatAgeRange, formatName } from './format'
import type { User } from './schema'
import type { DepartmentMap } from './types'

/** Running totals for one department while scanning users. */
type DepartmentStats = {
  male: number
  female: number
  minAge: number
  maxAge: number
  hair: Record<string, number>
  addressUser: Record<string, string>
}

/**
 * Dictionary without a prototype, for keys that come from external data.
 * On a plain `{}`, keys like "__proto__" or "constructor" hit
 * Object.prototype: `obj['__proto__'] = x` is dropped or swaps the prototype,
 * and `(obj['constructor'] ?? 0) + 1` yields a string instead of 1.
 * With no prototype, every key is a regular own property and still
 * serializes to plain JSON.
 */
const createDict = <V>(): Record<string, V> => Object.create(null)

/**
 * Creates empty running totals for one department. Ages start at ±Infinity
 * so the first user's age always becomes both min and max.
 */
const createDepartmentStats = (): DepartmentStats => ({
  male: 0,
  female: 0,
  minAge: +Infinity,
  maxAge: -Infinity,
  hair: createDict(),
  addressUser: createDict(),
})

/**
 * Groups users by department in a single pass over the users (O(n)),
 * then formats one summary per department (O(d)).
 */
export function groupByDepartment(users: readonly User[]): DepartmentMap {
  // Map for the internal running totals: it starts truly empty (no inherited
  // keys like "constructor"), and get/set are made for keys added at runtime.
  // The plain-object output, needed for JSON, is built after the loop.
  const statsMap = new Map<string, DepartmentStats>()

  for (const user of users) {
    let dptStats = statsMap.get(user.company.department)

    if (dptStats === undefined) {
      dptStats = createDepartmentStats()
      statsMap.set(user.company.department, dptStats)
    }

    // Other `gender` values are not counted, but the user still contributes
    // to the age range, hair colors and addresses below.
    if (user.gender === 'male') dptStats.male++
    if (user.gender === 'female') dptStats.female++
    if (user.age < dptStats.minAge) dptStats.minAge = user.age
    if (user.age > dptStats.maxAge) dptStats.maxAge = user.age
    dptStats.hair[user.hair.color] = (dptStats.hair[user.hair.color] ?? 0) + 1
    dptStats.addressUser[formatName(user.firstName, user.lastName)] =
      user.address.postalCode
  }

  const summary = createDict<DepartmentMap[string]>()

  // `ageRange` needs the final min/max, so format once per department here.
  for (const [department, stats] of statsMap) {
    summary[department] = {
      male: stats.male,
      female: stats.female,
      ageRange: formatAgeRange(stats.minAge, stats.maxAge),
      hair: stats.hair,
      addressUser: stats.addressUser,
    }
  }

  return summary
}
