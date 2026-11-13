import * as z from 'zod/mini'

// Input: only the dummyjson fields the transform reads.
// Strict on structure (required fields, right types), lenient on values:
// e.g. any hair color or gender string is accepted.
const UserSchema = z.object({
  firstName: z.string().check(z.minLength(1)),
  lastName: z.string().check(z.minLength(1)),
  age: z.int().check(z.nonnegative()),
  gender: z.string(),
  hair: z.object({
    color: z.string().check(z.minLength(1)),
  }),
  address: z.object({
    postalCode: z.string().check(z.minLength(1)),
  }),
  company: z.object({
    department: z.string().check(z.minLength(1)),
  }),
})

type User = z.infer<typeof UserSchema>

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

export { UserSchema, type DepartmentMap, type DepartmentSummary, type User }
