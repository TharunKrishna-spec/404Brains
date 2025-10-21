
import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Critical Error: Missing Supabase environment variables in Edge Function.");
    }
    
    // Create a Supabase client with the admin Service Role KEY
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      // Add auth.persistSession = false to prevent the admin client from trying to store session information,
      // which is unnecessary and can cause issues in a serverless environment.
      { auth: { persistSession: false } } 
    )
    
    const { user_id } = await req.json()

    if (!user_id) {
        throw new Error("A 'user_id' is required in the request body.")
    }

    // Safely call the deleteUser method
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (error) {
      if (error.message.includes('User not found')) {
        console.warn(`Attempted to delete user ${user_id}, but they were not found.`)
        // This is not a failure case from the client's perspective, so return 200 OK.
        return new Response(JSON.stringify({ message: `User ${user_id} not found, request successful.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        // Any other error from Supabase auth admin is a server error.
        throw error
      }
    }

    return new Response(JSON.stringify({ message: `User ${user_id} deleted successfully.`, user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in delete-user function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
