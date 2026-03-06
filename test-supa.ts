import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://dznjduuyxwndqgrayxgw.supabase.co',
    'sb_publishable_PQFGrd2h0vo2fgWZoLQRQQ_FndA495h'
);

async function testInsert() {
    const payload = {
        id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        name: 'Dayane',
        email: 'dayanelago22@gmail.com',
        phone: '2407806473',
        address: '3944 constance rd',
        city: 'bensalem',
        state: 'PA',
        zip_code: '19020',
        status: 'LEAD',
        lang: 'en',
        analyst: 'binnovationmarketing@gmail.com',
        observations: [],
        referrals: []
    };

    const { data, error } = await supabase
        .from('clients')
        .insert([payload])
        .select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success!', data);
    }
}

testInsert();
