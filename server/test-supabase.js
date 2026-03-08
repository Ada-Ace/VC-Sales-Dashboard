const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    console.log(`Checking connection to: ${url}`);

    try {
        const supabase = createClient(url, key);
        // Listing tables is not directly possible via public anon key, but we can try to find the sales_data table
        const { data, error } = await supabase
            .from('sales_data')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Supabase Connection Failed:');
            console.error(error.message);
            if (error.message.includes('relation "sales_data" does not exist')) {
                console.log('💡 Note: The table "sales_data" has not been created in your Supabase project yet.');
            }
        } else {
            console.log('✅ Supabase Connection Successful!');
            console.log(`Found ${data.length} records in 'sales_data' table.`);
        }
    } catch (err) {
        console.error('❌ Error during connection test:');
        console.error(err.message);
    }
}

testConnection();
