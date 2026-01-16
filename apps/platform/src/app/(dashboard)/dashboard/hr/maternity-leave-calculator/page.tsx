"use client";

import React, { useState, useCallback } from 'react';
import { InputForm } from '@/components/hr/maternity-calculator/InputForm';
import { ResultsDisplay } from '@/components/hr/maternity-calculator/ResultsDisplay';
import { calculateEntitlements, CalculatorInputs, CalculationResults } from '@/lib/hr/calculationEngine';
import { Baby, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MaternityLeaveCalculatorPage() {
    const [inputs, setInputs] = useState<CalculatorInputs>({
        role: 'teacher',
        schoolType: 'maintained',
        serviceYears: 2,
        serviceMonths: 0,
        laServiceYears: 2,
        laServiceMonths: 0,
        academyPolicy: 'statutory',
        annualSalary: 35000,
        isAnnualised: 'yes',
        leaveType: 'maternity',
        ewcOrPlacementDate: '',
        leaveStartDate: '',
        returnIntent: 'yes',
        splMotherWeeksTaken: 10,
        splPartnerWeeksToTake: 12,
    });
    const [results, setResults] = useState<CalculationResults | null>(null);
    const [error, setError] = useState<string>('');

    const handleInputChange = useCallback((event: any) => {
        const { name, value, type, checked } = event.target || event;
        const isCheckbox = type === 'checkbox';

        setInputs((prev: any) => ({
            ...prev,
            [name]: isCheckbox ? checked : value,
        }));

        setResults(null);
        setError('');
    }, []);

    const handleCalculate = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!inputs.ewcOrPlacementDate) {
            setError('Please enter the Expected Week of Childbirth or Placement Date.');
            return;
        }

        try {
            const calculatedResults = calculateEntitlements(inputs);
            setResults(calculatedResults);
        } catch (err: any) {
            setError(err.message || 'Calculation error');
        }
    }, [inputs]);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/dashboard/hr" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors group">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    BACK TO HR MODULE
                </Link>
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100">
                        <Baby size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Parental Pay <span className="text-gray-400">Calculator.</span></h1>
                        <p className="text-gray-500 font-medium">Estimate entitlements for maternity, paternity, and adoption leave.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
                    <InputForm
                        inputs={inputs}
                        handleInputChange={handleInputChange}
                        handleCalculate={handleCalculate}
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center font-bold text-sm">
                        {error}
                    </div>
                )}

                {results && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ResultsDisplay results={results} />
                    </div>
                )}
            </div>

            <footer className="bg-gray-50 p-8 rounded-[2rem] text-xs text-gray-400 font-medium space-y-2">
                <p><strong>Disclaimer:</strong> This calculator provides estimates only based on current UK law (April 2024 rates). Always verify with HR.</p>
                <p>Schoolgle HR Intelligence Platform - Workforce Support.</p>
            </footer>
        </div>
    );
}
