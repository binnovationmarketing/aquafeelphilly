import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://dznjduuyxwndqgrayxgw.supabase.co',
    'sb_publishable_PQFGrd2h0vo2fgWZoLQRQQ_FndA495h'
);

async function testSingle() {
    const fakeId = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('id', fakeId)
        .single();

    console.log('Result of .single() on non-existent row:');
    console.log('Data:', data);
    console.log('Error:', error);
}

testSingle();
