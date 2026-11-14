import * as z from 'zod/mini'

// Input: only the dummyjson fields the transform reads.
// Strict on structure (required fields, right types), lenient on values:
// e.g. any hair color or gender string is accepted.
const UserSchema = z.object({
  firstName: z.string().check(z.minLength(1)),
  lastName: z.string().check(z.minLength(1)),
  age: z.int().check(z.positive()),
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

const UsersPaginatedResponseSchema = z.object({
  users: z.array(UserSchema),
  limit: z.number(),
  skip: z.number(),
  total: z.number(),
})

const DEFAULT_SEARCH_RESULT_LIMIT = 30

const UserQueryParamsSchema = z.object({
  // Defaults or fallbacks to 30 search results if undefined or in case of a validation error.
  limit: z.pipe(
    z._default(
      z.catch(z.number().check(z.nonnegative()), DEFAULT_SEARCH_RESULT_LIMIT),
      DEFAULT_SEARCH_RESULT_LIMIT,
    ),
    z.transform((val) => String(val)),
  ),
  skip: z.optional(
    z.pipe(z.number().check(z.nonnegative()), z.transform(String)),
  ),
  select: z.optional(z.string()),
})

type User = z.infer<typeof UserSchema>
type UsersPaginatedResponse = z.infer<typeof UsersPaginatedResponseSchema>
type UserQueryParams = z.input<typeof UserQueryParamsSchema>

export {
  DEFAULT_SEARCH_RESULT_LIMIT,
  UsersPaginatedResponseSchema,
  UserQueryParamsSchema,
  UserSchema,
  type User,
  type UsersPaginatedResponse,
  type UserQueryParams,
}
