import { NextResponse } from 'next/server';
import { getSalesData } from '@/lib/dataService';

export async function GET() {
    try {
        const data = await getSalesData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API /api/sales Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
