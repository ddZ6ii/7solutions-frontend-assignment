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

/**
 * Top-level user fields to request from dummyjson (`select=`), derived from
 * the schema so the request and the validation can't drift apart.
 */
const USER_FIELDS = Object.keys(UserSchema.shape)

// Only `users` is read: pagination fields (limit, skip, total) aren't
// required, so their absence can't break the endpoint.
const UsersResponseSchema = z.object({
  users: z.array(UserSchema),
})

type User = z.infer<typeof UserSchema>
type UsersResponse = z.infer<typeof UsersResponseSchema>

export {
  USER_FIELDS,
  UserSchema,
  UsersResponseSchema,
  type User,
  type UsersResponse,
}
