"use client";

import React from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalculatorInputs } from "@/lib/hr/calculationEngine";

interface InputFormProps {
    inputs: CalculatorInputs;
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | Date | undefined } }) => void;
    handleCalculate: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function InputForm({ inputs, handleInputChange, handleCalculate }: InputFormProps) {
    const handleSelectChange = (name: string) => (value: string) => {
        handleInputChange({ target: { name, value } });
    };

    const handleDateChange = (name: string) => (date: Date | undefined) => {
        const value = date ? format(date, "yyyy-MM-dd") : '';
        handleInputChange({ target: { name, value } });
    };

    return (
        <form onSubmit={handleCalculate} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select name="role" value={inputs.role} onValueChange={handleSelectChange('role')} required>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="support">Support Staff</SelectItem>
                        <SelectItem value="other">Other Education Staff</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="schoolType">School Type</Label>
                <Select name="schoolType" value={inputs.schoolType} onValueChange={handleSelectChange('schoolType')} required>
                    <SelectTrigger id="schoolType">
                        <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="maintained">Maintained School</SelectItem>
                        <SelectItem value="academy">Academy/Free School</SelectItem>
                        <SelectItem value="independent">Independent School</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(inputs.schoolType === 'academy' || inputs.schoolType === 'independent') && (
                <div className="space-y-2">
                    <Label htmlFor="academyPolicy">Pay Policy Type</Label>
                    <Select name="academyPolicy" value={inputs.academyPolicy} onValueChange={handleSelectChange('academyPolicy')} required>
                        <SelectTrigger id="academyPolicy">
                            <SelectValue placeholder="Select pay policy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="statutory">Statutory Only</SelectItem>
                            <SelectItem value="burgundy">Burgundy Book</SelectItem>
                            <SelectItem value="green">Green Book</SelectItem>
                            <SelectItem value="custom">Custom Policy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Service Years (Current)</Label>
                    <Input
                        type="number"
                        name="serviceYears"
                        value={inputs.serviceYears}
                        onChange={handleInputChange}
                        min="0"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Service Months</Label>
                    <Input
                        type="number"
                        name="serviceMonths"
                        value={inputs.serviceMonths}
                        onChange={handleInputChange}
                        min="0"
                        max="11"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="annualSalary">Current Annual Salary (£)</Label>
                <Input
                    type="number"
                    id="annualSalary"
                    name="annualSalary"
                    value={inputs.annualSalary}
                    onChange={handleInputChange}
                    min="0"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="ewcOrPlacementDate">
                    {inputs.leaveType === 'adoption' ? 'Expected Placement Date' : 'Expected Week of Childbirth (EWC)'}
                </Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !inputs.ewcOrPlacementDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {inputs.ewcOrPlacementDate ? format(new Date(inputs.ewcOrPlacementDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={inputs.ewcOrPlacementDate ? new Date(inputs.ewcOrPlacementDate) : undefined}
                            onSelect={handleDateChange('ewcOrPlacementDate')}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <Button type="submit" className="w-full" size="lg">
                Calculate Entitlements
            </Button>
        </form>
    );
}
