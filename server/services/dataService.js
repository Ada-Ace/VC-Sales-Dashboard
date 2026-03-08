const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const CSV_PATH = path.join(__dirname, '..', '..', 'sales_data.csv');

// Supabase Client (Initialized Lazily)
let supabase = null;
const initSupabase = () => {
    if (supabase) return supabase;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !url.startsWith('http')) {
        throw new Error('Invalid or missing SUPABASE_URL in .env');
    }
    if (!key) {
        throw new Error('Missing SUPABASE_KEY in .env');
    }

    supabase = createClient(url, key);
    return supabase;
};

const getSalesFromCSV = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(CSV_PATH)) {
            return reject(new Error('CSV file not found at ' + CSV_PATH));
        }

        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                const sanitized = results.map(row => ({
                    ...row,
                    revenue: Number(row.revenue || 0),
                    orders: Number(row.orders || 0),
                    cost: Number(row.cost || 0),
                    visitors: Number(row.visitors || 0),
                    customers: Number(row.customers || 0)
                }));
                resolve(sanitized);
            })
            .on('error', (err) => reject(err));
    });
};

const getSalesFromSupabase = async () => {
    const client = initSupabase();
    const { data, error } = await client
        .from('sales_data')
        .select('*');

    if (error) throw error;
    return data;
};

const getSalesData = async () => {
    const source = process.env.DATA_SOURCE || 'csv';

    if (source === 'supabase') {
        return await getSalesFromSupabase();
    } else {
        return await getSalesFromCSV();
    }
};

module.exports = {
    getSalesData
};
