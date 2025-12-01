import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server component helper - only use this in server components and API routes
export const createServerClient = async () => {
  const cookieStore = await cookies()

  return createSSRServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

// Service role client for admin operations that bypass RLS
export const createServiceClient = () => {
  return createSSRServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() { return undefined },
      set() {},
      remove() {},
    },
  })
}