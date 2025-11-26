import { NextResponse } from 'next/server';

export async function GET() {
    const csvContent = `email,name,role
john.smith@school.edu,John Smith,teacher
sarah.jones@school.edu,Sarah Jones,slt
mike.wilson@school.edu,Mike Wilson,admin
emma.brown@school.edu,Emma Brown,teacher`;

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="user_import_template.csv"'
        }
    });
}

