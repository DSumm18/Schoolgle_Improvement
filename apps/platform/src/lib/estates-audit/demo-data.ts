import type { SchoolData } from '@/types/estates-audit';

export const DEMO_SCHOOLS: SchoolData[] = [
    {
        id: 'pennine-primary',
        name: 'Pennine Primary Academy',
        overallScore: 78,
        logoUrl: null,
        categories: [
            {
                categoryName: 'Building Maintenance',
                average: 85,
                assessments: [
                    { name: 'Heating Systems', score: 90 },
                    { name: 'Plumbing', score: 80 },
                    { name: 'Electrical Systems', score: 85 },
                    { name: 'Roof Condition', score: 75 },
                    { name: 'Windows & Doors', score: 90 }
                ]
            },
            {
                categoryName: 'Health & Safety',
                average: 72,
                assessments: [
                    { name: 'Fire Safety', score: 85 },
                    { name: 'Asbestos Management', score: 60 },
                    { name: 'COSHH Compliance', score: 75 },
                    { name: 'Risk Assessments', score: 80 },
                    { name: 'Emergency Procedures', score: 70 }
                ]
            },
            {
                categoryName: 'Energy Efficiency',
                average: 65,
                assessments: [
                    { name: 'Insulation', score: 70 },
                    { name: 'Lighting', score: 60 },
                    { name: 'Heating Controls', score: 65 },
                    { name: 'Renewable Energy', score: 50 },
                    { name: 'Energy Monitoring', score: 80 }
                ]
            },
            {
                categoryName: 'Accessibility',
                average: 88,
                assessments: [
                    { name: 'Wheelchair Access', score: 90 },
                    { name: 'Hearing Loops', score: 85 },
                    { name: 'Visual Aids', score: 90 },
                    { name: 'Toilet Facilities', score: 85 },
                    { name: 'Emergency Evacuation', score: 90 }
                ]
            }
        ]
    },
    {
        id: 'valley-secondary',
        name: 'Valley Secondary School',
        overallScore: 82,
        logoUrl: null,
        categories: [
            {
                categoryName: 'Building Maintenance',
                average: 88,
                assessments: [
                    { name: 'Heating Systems', score: 90 },
                    { name: 'Plumbing', score: 85 },
                    { name: 'Electrical Systems', score: 90 },
                    { name: 'Roof Condition', score: 85 },
                    { name: 'Windows & Doors', score: 90 }
                ]
            },
            {
                categoryName: 'Health & Safety',
                average: 78,
                assessments: [
                    { name: 'Fire Safety', score: 90 },
                    { name: 'Asbestos Management', score: 70 },
                    { name: 'COSHH Compliance', score: 80 },
                    { name: 'Risk Assessments', score: 85 },
                    { name: 'Emergency Procedures', score: 75 }
                ]
            },
            {
                categoryName: 'Energy Efficiency',
                average: 72,
                assessments: [
                    { name: 'Insulation', score: 75 },
                    { name: 'Lighting', score: 70 },
                    { name: 'Heating Controls', score: 75 },
                    { name: 'Renewable Energy', score: 60 },
                    { name: 'Energy Monitoring', score: 80 }
                ]
            },
            {
                categoryName: 'Accessibility',
                average: 90,
                assessments: [
                    { name: 'Wheelchair Access', score: 95 },
                    { name: 'Hearing Loops', score: 90 },
                    { name: 'Visual Aids', score: 90 },
                    { name: 'Toilet Facilities', score: 90 },
                    { name: 'Emergency Evacuation', score: 85 }
                ]
            }
        ]
    }
];
