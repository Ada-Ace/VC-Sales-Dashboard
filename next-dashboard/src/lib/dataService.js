import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';

// Get the root directory's sales_data.csv (we're sharing it temporarily)
const CSV_PATH = path.join(process.cwd(), '..', 'sales_data.csv');

// Supabase Client (Initialized Lazily)
let supabase = null;
const initSupabase = () => {
    if (supabase) return supabase;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !url.startsWith('http')) {
        throw new Error('Invalid or missing SUPABASE_URL in environment');
    }
    if (!key) {
        throw new Error('Missing SUPABASE_ANON_KEY in environment');
    }

    supabase = createClient(url, key);
    return supabase;
};

export const getSalesFromCSV = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        // If not found in parent directory, try current dir, or fallback to an empty array
        let actualPath = CSV_PATH;
        if (!fs.existsSync(actualPath)) {
            actualPath = path.join(process.cwd(), 'sales_data.csv');
            if (!fs.existsSync(actualPath)) {
                return reject(new Error('CSV file not found'));
            }
        }

        fs.createReadStream(actualPath)
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

export const getSalesFromSupabase = async () => {
    try {
        const client = initSupabase();
        const { data, error } = await client
            .from('sales_data')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
    } catch (err) {
        throw err;
    }
};

export const getSalesData = async () => {
    const source = process.env.DATA_SOURCE || 'csv';

    if (source === 'supabase') {
        return await getSalesFromSupabase();
    } else {
        return await getSalesFromCSV();
    }
};
