import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://jwxkxhdtebazwkazywbk.supabase.co';
const supabaseAnonKey = 'sb_publishable_5cqgFN--6Cn0bPGcbH8gSQ_zRX0ufSo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const phone = `+91999999${Math.floor(1000 + Math.random() * 9000)}`;
  const password = "Password123";
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    phone,
    password
  });
  console.log("Phone Signup:", signUpError ? signUpError.message : "Success");
  
  if (signUpData?.user) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        phone, password
    });
    console.log("Phone SignIn after Signup:", signInError ? signInError.message : "Success");
  }
}
testAuth();
