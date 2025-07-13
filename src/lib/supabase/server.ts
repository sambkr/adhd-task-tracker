import { createServerComponentClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })
}