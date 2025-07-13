import { createClientComponentClient } from '@supabase/ssr'
import { Database } from './types'

export const createClient = () => createClientComponentClient<Database>()