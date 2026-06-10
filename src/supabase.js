import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xxnuibbvvhrlwyfzbvqk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnVpYmJ2dmhybHd5ZnpidnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDAwNDAsImV4cCI6MjA5NjYxNjA0MH0.BDUKiqNn3w1obQsJmI0H2FczqaZ7svGmjgVXTGHMDFA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
