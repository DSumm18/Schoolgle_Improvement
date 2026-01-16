"use client";

import React from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/Accordion";
import { CalculationResults } from "@/lib/hr/calculationEngine";

interface ResultsDisplayProps {
    results: CalculationResults | null;
}

const formatCurrency = (amount: number | undefined | null): string => {
    if (typeof amount !== 'number') return 'N/A';
    return amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
};

const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        return format(date, 'dd MMM yyyy');
    } catch (e) {
        return dateString;
    }
};

export function ResultsDisplay({ results }: ResultsDisplayProps) {
    if (!results) return null;

    const { eligibility, keyDates, paySchedule, notes } = results;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Eligibility Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between font-medium">
                        <span>Statutory Leave:</span>
                        <span>{eligibility.statutoryLeaveWeeks} weeks</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Statutory Pay ({eligibility.statutoryPayType}):</span>
                        <Badge variant={eligibility.statutoryPayEligible ? "outline" : "destructive"}>
                            {eligibility.statutoryPayEligible ? `Eligible (${eligibility.statutoryPayWeeks} weeks)` : "Not Eligible"}
                        </Badge>
                    </div>
                    {!eligibility.statutoryPayEligible && eligibility.statutoryPayReason && (
                        <p className="text-sm text-red-600">Note: {eligibility.statutoryPayReason}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pay Schedule (Estimated)</CardTitle>
                    <CardDescription>Amounts shown before tax and deductions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Weeks</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Weekly Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paySchedule.slice(0, 20).map((week, i) => (
                                <TableRow key={i}>
                                    <TableCell>{week.weekNum}</TableCell>
                                    <TableCell className="text-xs">{week.payType}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(week.amount)}</TableCell>
                                </TableRow>
                            ))}
                            {paySchedule.length > 20 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground italic">... and {paySchedule.length - 20} more weeks</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {notes.map((note, i) => (
                    <Alert key={i} variant={note.type === 'warning' ? 'destructive' : 'default'}>
                        {note.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                        <AlertTitle>{note.type === 'warning' ? 'Important' : 'Note'}</AlertTitle>
                        <AlertDescription>{note.text}</AlertDescription>
                    </Alert>
                ))}
            </div>
        </div>
    );
}
