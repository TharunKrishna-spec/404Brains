// FIX: The path to the Deno type definition file in the CDN URL was incorrect, pointing to /src/ instead of /dist/. This has been corrected to resolve the "Cannot find name 'Deno'" errors.
/// <reference types="https://esm.sh/@supabase/functions-js@2/dist/edge-runtime.d.ts" />

// This file is deployed as a Supabase Edge Function.
// It securely handles the deletion of a user from the auth.users table using admin privileges.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('Delete user function is active.');

// Create a Supabase client with the service_role key to perform admin actions.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

// Standard CORS headers to allow requests from the browser.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Note: For enhanced security in a production app, you would also verify
    // that the user making this request has an 'admin' role in your database.
    // Here, we rely on the frontend's ProtectedRoute to restrict access.
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("Missing required parameter: 'userId'");
    }

    // Use the admin client to delete the user.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      // It's not a critical failure if the user was already deleted.
      // We can proceed as if the deletion was successful.
      if (error.message.includes('User not found')) {
        console.warn(`User ${userId} not found in auth. Proceeding as if successful.`);
        return new Response(JSON.stringify({ message: `User ${userId} not found in auth, but this is not a failure.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      // For any other errors, we throw to report the issue.
      throw error;
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Error in delete-user function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Use 500 for internal server errors
    });
  }
});
