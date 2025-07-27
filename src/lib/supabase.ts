import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bpjlnxorlwfbuemibvbm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamxueG9ybHdmYnVlbWlidmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMyNzEsImV4cCI6MjA2OTIxOTI3MX0.AkPPfrzgj3KkyF8RFTePARbQGXm9F67aDG3s1IGCvTo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 