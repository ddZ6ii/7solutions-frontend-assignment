// Output: shape required by the assignment.
type DepartmentSummary = {
  male: number
  female: number
  /** "min-max" */
  ageRange: string
  /** color → count */
  hair: Record<string, number>
  /** firstName + lastName → postal code */
  addressUser: Record<string, string>
}

type DepartmentMap = Record<string, DepartmentSummary>

export { type DepartmentMap, type DepartmentSummary }
