import { createApp } from './app'
import { getDepartments } from './departments/get-departments'

// Vercel entry point
export default createApp({ getDepartments })
