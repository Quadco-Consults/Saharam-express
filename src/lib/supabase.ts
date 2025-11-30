import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Client component helper
export const createBrowserClientHelper = () => {
  return createBrowserClient(supabaseUrl, supabaseKey)
}

// Server component helper
export const createServerClient = () => {
  const cookieStore = cookies()

  return createSSRServerClient(supabaseUrl, supabaseKey, {
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

// Admin client with service role key (server-side only)
export const createAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Supabase service role key is required for admin operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          is_verified: boolean
          role: 'customer' | 'admin' | 'driver'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          is_verified?: boolean
          role?: 'customer' | 'admin' | 'driver'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          is_verified?: boolean
          role?: 'customer' | 'admin' | 'driver'
          updated_at?: string
        }
      }
      routes: {
        Row: {
          id: string
          from_city: string
          to_city: string
          distance: number
          base_fare: number
          estimated_duration: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_city: string
          to_city: string
          distance: number
          base_fare: number
          estimated_duration: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          from_city?: string
          to_city?: string
          distance?: number
          base_fare?: number
          estimated_duration?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate_number: string
          model: string
          capacity: number
          year: number
          color: string
          is_active: boolean
          last_maintenance: string | null
          next_maintenance: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plate_number: string
          model: string
          capacity: number
          year: number
          color: string
          is_active?: boolean
          last_maintenance?: string | null
          next_maintenance?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          plate_number?: string
          model?: string
          capacity?: number
          year?: number
          color?: string
          is_active?: boolean
          last_maintenance?: string | null
          next_maintenance?: string | null
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          route_id: string
          vehicle_id: string
          driver_id: string
          departure_time: string
          arrival_time: string
          available_seats: number
          total_seats: number
          base_price: number
          status: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_id: string
          vehicle_id: string
          driver_id: string
          departure_time: string
          arrival_time: string
          available_seats: number
          total_seats: number
          base_price: number
          status?: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          route_id?: string
          vehicle_id?: string
          driver_id?: string
          departure_time?: string
          arrival_time?: string
          available_seats?: number
          total_seats?: number
          base_price?: number
          status?: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled'
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          trip_id: string
          passenger_name: string
          passenger_phone: string
          seat_numbers: string[]
          total_amount: number
          booking_reference: string
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: 'paystack' | 'opay' | 'flutterwave' | 'bank_transfer' | null
          payment_reference: string | null
          qr_code: string | null
          status: 'confirmed' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trip_id: string
          passenger_name: string
          passenger_phone: string
          seat_numbers: string[]
          total_amount: number
          booking_reference?: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: 'paystack' | 'opay' | 'flutterwave' | 'bank_transfer' | null
          payment_reference?: string | null
          qr_code?: string | null
          status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          passenger_name?: string
          passenger_phone?: string
          seat_numbers?: string[]
          total_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: 'paystack' | 'opay' | 'flutterwave' | 'bank_transfer' | null
          payment_reference?: string | null
          qr_code?: string | null
          status?: 'confirmed' | 'cancelled' | 'completed'
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          currency: string
          gateway: 'paystack' | 'opay' | 'flutterwave'
          gateway_reference: string
          gateway_response: any
          status: 'pending' | 'success' | 'failed'
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          currency?: string
          gateway: 'paystack' | 'opay' | 'flutterwave'
          gateway_reference: string
          gateway_response?: any
          status?: 'pending' | 'success' | 'failed'
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          gateway_response?: any
          status?: 'pending' | 'success' | 'failed'
          paid_at?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'sms' | 'email' | 'push'
          title: string
          message: string
          is_read: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'sms' | 'email' | 'push'
          title: string
          message: string
          is_read?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}