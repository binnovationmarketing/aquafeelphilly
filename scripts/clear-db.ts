import { supabase } from '../lib/supabase.ts';

async function clearDatabase() {
    console.log('Starting database cleanup...');

    try {
        // Delete all tasks
        console.log('Deleting tasks...');
        const { error: tasksError } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (tasksError) console.error('Tasks error:', tasksError);

        // Delete all referrals
        console.log('Deleting referrals...');
        const { error: referralsError } = await supabase.from('referrals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (referralsError) console.error('Referrals error:', referralsError);

        // Delete all clients
        console.log('Deleting clients...');
        const { error: clientsError } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clientsError) console.error('Clients error:', clientsError);

        // Delete all users except admins (be careful)
        console.log('Deleting users (non-admin)...');
        const { error: usersError } = await supabase.from('users').delete().neq('role', 'admin');
        if (usersError) console.error('Users error:', usersError);

        console.log('Database cleanup completed!');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

clearDatabase();