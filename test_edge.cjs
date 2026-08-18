const fs = require('fs');
const readline = require('readline');
const fetch = require('node-fetch');

async function testEdgeFunction() {
    const SUPABASE_URL = 'https://shmbwdjuddvquszwkvuq.supabase.co';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Wait, I need the anon key from .env

    // Fetch anon key from .env
    const env = fs.readFileSync('.env', 'utf-8');
    const match = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/);
    if (!match) return console.error('Key not found');
    const key = match[1];

    console.log('Sending test payload to Edge Function...');
    const res = await fetch(SUPABASE_URL + '/functions/v1/send-invite-campaign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
            contacts: [{ email: 'teste@plantayraiz.com.br', name: 'Dr. Teste' }],
            batchSize: 1,
            dryRun: true
        })
    });
    
    console.log(res.status);
    const json = await res.json();
    console.log(json);
}

testEdgeFunction();
