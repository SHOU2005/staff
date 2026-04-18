import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://jwxkxhdtebazwkazywbk.supabase.co';
const supabaseAnonKey = 'sb_publishable_5cqgFN--6Cn0bPGcbH8gSQ_zRX0ufSo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const email = `test${Date.now()}@switch.com`;
  const password = "Password123";
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  console.log("Signup:", signUpError ? signUpError.message : "Success");
  
  if (signUpData?.user) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email, password
    });
    console.log("SignIn after Signup:", signInError ? signInError.message : "Success");
  }
}
testAuth();
