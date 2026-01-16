import { addWeeks, differenceInCalendarWeeks, formatISO, parseISO, startOfWeek, subWeeks } from 'date-fns';

// --- Types ---
export interface CalculatorInputs {
    role: string;
    schoolType: string;
    serviceYears: number | string;
    serviceMonths: number | string;
    laServiceYears: number | string;
    laServiceMonths: number | string;
    academyPolicy: string;
    annualSalary: number | string;
    isAnnualised: string;
    leaveType: string;
    ewcOrPlacementDate: string;
    leaveStartDate: string;
    returnIntent: string;
    splMotherWeeksTaken: number | string;
    splPartnerWeeksToTake: number | string;
    estimatedRepayment?: number;
}

export interface Eligibility {
    statutoryLeaveWeeks: number;
    statutoryLeaveEligible: boolean;
    statutoryPayType: string;
    statutoryPayEligible: boolean;
    statutoryPayWeeks: number;
    statutoryPayReason?: string;
    occupationalPayEligible: boolean | 'N/A';
    occupationalSchemeName?: string;
    occupationalPayReason?: string;
    termTimeWarning?: string;
}

export interface KeyDates {
    ewcOrPlacementDate: string;
    qualifyingWeek: string;
    occupationalPayServiceCheckWeek: string;
    earliestLeaveStartDate: string;
    latestLeaveEndDate: string;
    statutoryPayEndDate: string;
}

export interface PayScheduleEntry {
    weekNum: number;
    startDate: string;
    endDate: string;
    payType: string;
    amount: number;
    notes?: string;
}

export interface Note {
    text: string;
    type?: 'info' | 'warning';
    source?: string;
}

export interface CalculationResults {
    eligibility: Eligibility;
    keyDates?: KeyDates;
    paySchedule: PayScheduleEntry[];
    notes: Note[];
    leaveType: string;
    estimatedRepayment?: number;
}

// Constants
const STATUTORY_RATE = 187.18;
const LOWER_EARNINGS_LIMIT = 123;
const WEEKS_IN_YEAR = 52.14;
const TOTAL_LEAVE_WEEKS = 52;
const STATUTORY_PAY_WEEKS_MAT_ADOPT = 39;
const COMPULSORY_MATERNITY_LEAVE_WEEKS = 2;
const SMP_SAP_INITIAL_WEEKS = 6;
const SPP_WEEKS = 2;
const SPL_MAX_SHARED_LEAVE_WEEKS = TOTAL_LEAVE_WEEKS - COMPULSORY_MATERNITY_LEAVE_WEEKS;
const SPL_MAX_SHARED_PAY_WEEKS = STATUTORY_PAY_WEEKS_MAT_ADOPT - COMPULSORY_MATERNITY_LEAVE_WEEKS;
const KIT_DAYS = 10;
const SPLIT_DAYS = 20;

// Helper Functions
const calculateAWE = (annualSalary: number | string): number => {
    const salary = parseFloat(String(annualSalary));
    if (isNaN(salary) || salary <= 0) return 0;
    return salary / WEEKS_IN_YEAR;
};

const calculateServiceWeeks = (years: number | string, months: number | string): number => {
    const y = parseInt(String(years), 10) || 0;
    const m = parseInt(String(months), 10) || 0;
    return (y * 52) + (m * (52 / 12));
};

const safeParseDate = (dateString: string): Date | null => {
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) return null;
        return date;
    } catch (e) {
        return null;
    }
};

const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
};

// Main Calculation Function
export const calculateEntitlements = (inputs: CalculatorInputs): CalculationResults => {
    const {
        role, schoolType, serviceYears, serviceMonths, laServiceYears, laServiceMonths,
        academyPolicy, annualSalary, isAnnualised, leaveType, ewcOrPlacementDate,
        leaveStartDate: inputLeaveStartDate,
        returnIntent, splMotherWeeksTaken, splPartnerWeeksToTake
    } = inputs;

    const results: CalculationResults = {
        eligibility: {
            statutoryLeaveWeeks: 0,
            statutoryLeaveEligible: false,
            statutoryPayType: 'N/A',
            statutoryPayEligible: false,
            statutoryPayWeeks: 0,
            statutoryPayReason: 'Not checked yet',
            occupationalPayEligible: 'N/A',
            occupationalSchemeName: 'None',
            occupationalPayReason: 'N/A',
            termTimeWarning: undefined,
        },
        keyDates: undefined,
        paySchedule: [],
        notes: [],
        leaveType: leaveType,
        estimatedRepayment: 0
    };

    const awe = calculateAWE(annualSalary);
    const serviceWeeksCurrentEmployer = calculateServiceWeeks(serviceYears, serviceMonths);
    const laServiceWeeksTotal = calculateServiceWeeks(laServiceYears, laServiceMonths);
    const ewcDate = safeParseDate(ewcOrPlacementDate);

    if (!ewcDate) {
        throw new Error("Invalid EWC or Placement Date provided.");
    }

    const ewcSunday = startOfWeek(ewcDate, { weekStartsOn: 0 });

    const qualifyingWeekDate = subWeeks(ewcSunday, 15);
    const occPayServiceCheckDate = subWeeks(ewcSunday, 11);
    const earliestLeaveStartDate = subWeeks(ewcSunday, 11);
    const latestLeaveEndDate = addWeeks(ewcSunday, TOTAL_LEAVE_WEEKS);
    const statutoryPayEndDate = addWeeks(ewcSunday, STATUTORY_PAY_WEEKS_MAT_ADOPT);

    results.keyDates = {
        ewcOrPlacementDate: formatISO(ewcSunday, { representation: 'date' }),
        qualifyingWeek: formatISO(startOfWeek(qualifyingWeekDate), { representation: 'date' }),
        occupationalPayServiceCheckWeek: formatISO(startOfWeek(occPayServiceCheckDate), { representation: 'date' }),
        earliestLeaveStartDate: formatISO(earliestLeaveStartDate, { representation: 'date' }),
        latestLeaveEndDate: formatISO(latestLeaveEndDate, { representation: 'date' }),
        statutoryPayEndDate: formatISO(statutoryPayEndDate, { representation: 'date' }),
    };

    const leaveStartDate = safeParseDate(inputLeaveStartDate);
    const actualLeaveStartDate = leaveStartDate || ewcSunday;
    if (!leaveStartDate) {
        results.notes.push({ text: "Leave start date not provided. Pay schedule estimated from EWC.", type: 'info' });
    }

    if (leaveType === 'maternity' || leaveType === 'adoption') {
        results.eligibility.statutoryLeaveWeeks = TOTAL_LEAVE_WEEKS;
        results.eligibility.statutoryLeaveEligible = true;
    } else if (leaveType === 'paternity') {
        const meetsPatServiceReq = serviceWeeksCurrentEmployer >= 26;
        results.eligibility.statutoryLeaveWeeks = SPP_WEEKS;
        results.eligibility.statutoryLeaveEligible = meetsPatServiceReq;
        if (!meetsPatServiceReq) {
            results.eligibility.statutoryPayReason = `Insufficient service for SPP eligibility.`;
        }
    } else if (leaveType === 'spl') {
        results.eligibility.statutoryLeaveWeeks = SPL_MAX_SHARED_LEAVE_WEEKS;
        results.eligibility.statutoryLeaveEligible = true;
        results.notes.push({ text: "SPL eligibility depends on both parents meeting criteria.", type: "info" });
    }

    const meetsServiceReqForPay = serviceWeeksCurrentEmployer >= 26;
    const meetsEarningsReq = awe >= LOWER_EARNINGS_LIMIT;
    results.eligibility.statutoryPayEligible = meetsServiceReqForPay && meetsEarningsReq;

    if (!meetsServiceReqForPay) results.eligibility.statutoryPayReason = `Insufficient service (${serviceWeeksCurrentEmployer.toFixed(0)} weeks < 26 weeks) with current employer.`;
    else if (!meetsEarningsReq) results.eligibility.statutoryPayReason = `Average Weekly Earnings (${formatCurrency(awe)}) may be below Lower Earnings Limit.`;
    else results.eligibility.statutoryPayReason = 'Eligible';

    if ((isAnnualised === 'no' || isAnnualised === 'unsure') && !meetsEarningsReq) {
        results.eligibility.termTimeWarning = `Warning: As pay might not be annualised, average earnings calculated over reference period could fall below the LEL.`;
        results.notes.push({ text: results.eligibility.termTimeWarning, type: 'warning' });
        results.eligibility.statutoryPayEligible = meetsServiceReqForPay;
        if (!meetsServiceReqForPay) { results.eligibility.statutoryPayEligible = false; }
        else { results.eligibility.statutoryPayReason = `Eligibility depends on actual earnings in reference period.`; }
    }

    if (leaveType === 'maternity') results.eligibility.statutoryPayType = 'SMP';
    if (leaveType === 'adoption') results.eligibility.statutoryPayType = 'SAP';
    if (leaveType === 'paternity') results.eligibility.statutoryPayType = 'SPP';
    if (leaveType === 'spl') results.eligibility.statutoryPayType = 'ShPP';

    if (results.eligibility.statutoryPayEligible) {
        if (leaveType === 'maternity' || leaveType === 'adoption') results.eligibility.statutoryPayWeeks = STATUTORY_PAY_WEEKS_MAT_ADOPT;
        if (leaveType === 'paternity') results.eligibility.statutoryPayWeeks = SPP_WEEKS;
        if (leaveType === 'spl') {
            const motherWeeksTakenNum = parseInt(String(splMotherWeeksTaken), 10) || 0;
            const remainingPayWeeks = Math.max(0, STATUTORY_PAY_WEEKS_MAT_ADOPT - Math.max(0, motherWeeksTakenNum - COMPULSORY_MATERNITY_LEAVE_WEEKS));
            const weeksPartnerTakesNum = parseInt(String(splPartnerWeeksToTake), 10) || 0;
            results.eligibility.statutoryPayWeeks = Math.min(weeksPartnerTakesNum, remainingPayWeeks);
        }
    } else {
        results.eligibility.statutoryPayWeeks = 0;
    }

    let usesBurgundy = false;
    let usesGreenBook = false;
    results.eligibility.occupationalPayEligible = 'N/A';

    if (leaveType === 'maternity' || leaveType === 'adoption') {
        const meetsOccServiceReq = laServiceWeeksTotal >= 52;

        if (schoolType === 'maintained') {
            if (role === 'teacher') {
                results.eligibility.occupationalSchemeName = 'Burgundy Book';
                results.eligibility.occupationalPayEligible = meetsOccServiceReq;
                results.eligibility.occupationalPayReason = meetsOccServiceReq ? 'Eligible' : `Insufficient continuous LA service.`;
                if (meetsOccServiceReq) usesBurgundy = true;
            } else if (role === 'support') {
                results.eligibility.occupationalSchemeName = 'Green Book';
                results.eligibility.occupationalPayEligible = meetsOccServiceReq;
                results.eligibility.occupationalPayReason = meetsOccServiceReq ? 'Eligible' : `Insufficient continuous LA service.`;
                if (meetsOccServiceReq) usesGreenBook = true;
            }
        } else if (schoolType === 'academy' || schoolType === 'independent') {
            const policy = String(academyPolicy).toLowerCase();
            results.eligibility.occupationalSchemeName = `Academy/Independent Policy (${academyPolicy})`;
            if (policy === 'burgundy' && role === 'teacher') {
                usesBurgundy = true;
                results.eligibility.occupationalSchemeName = 'Burgundy Book (Adopted by School)';
                results.eligibility.occupationalPayEligible = meetsOccServiceReq;
            } else if (policy === 'green' && role === 'support') {
                usesGreenBook = true;
                results.eligibility.occupationalSchemeName = 'Green Book (Adopted by School)';
                results.eligibility.occupationalPayEligible = meetsOccServiceReq;
            } else if (policy === 'custom') {
                results.eligibility.occupationalPayEligible = true;
                results.eligibility.occupationalSchemeName = 'Custom Enhanced Scheme';
            }
        }
    }

    const paySchedule: PayScheduleEntry[] = [];
    let occupationalPayAboveStatutoryTotal = 0;
    const firstWeekStartDate = actualLeaveStartDate;

    for (let weekNum = 1; weekNum <= TOTAL_LEAVE_WEEKS; weekNum++) {
        let weeklyPay = 0;
        let payType = 'Unpaid';
        let notes = '';
        let statutoryComponent = 0;
        let occupationalComponent = 0;

        const currentWeekStartDate = addWeeks(firstWeekStartDate, weekNum - 1);
        const currentWeekEndDate = addWeeks(currentWeekStartDate, 1);
        currentWeekEndDate.setDate(currentWeekEndDate.getDate() - 1);

        if (results.eligibility.statutoryPayEligible) {
            const statutoryPayWeekNum = weekNum;

            if ((leaveType === 'maternity' || leaveType === 'adoption') && statutoryPayWeekNum <= STATUTORY_PAY_WEEKS_MAT_ADOPT) {
                if (statutoryPayWeekNum <= SMP_SAP_INITIAL_WEEKS) {
                    statutoryComponent = awe * 0.9;
                    payType = `Statutory Pay (${results.eligibility.statutoryPayType} - 90% AWE)`;
                    notes = '90% Average Weekly Earnings';
                } else {
                    statutoryComponent = Math.min(awe * 0.9, STATUTORY_RATE);
                    payType = `Statutory Pay (${results.eligibility.statutoryPayType} - Flat Rate)`;
                    notes = `£${STATUTORY_RATE.toFixed(2)} or 90% AWE, whichever is lower.`;
                }
            } else if (leaveType === 'paternity' && statutoryPayWeekNum <= SPP_WEEKS) {
                statutoryComponent = Math.min(awe * 0.9, STATUTORY_RATE);
                payType = 'Statutory Paternity Pay (SPP)';
                notes = `£${STATUTORY_RATE.toFixed(2)} or 90% AWE, whichever is lower.`;
            } else if (leaveType === 'spl' && statutoryPayWeekNum <= results.eligibility.statutoryPayWeeks) {
                statutoryComponent = Math.min(awe * 0.9, STATUTORY_RATE);
                payType = 'Statutory Shared Parental Pay (ShPP)';
                const weeksPartnerTakesNum = parseInt(String(splPartnerWeeksToTake), 10) || 0;
                if (statutoryPayWeekNum > weeksPartnerTakesNum) {
                    statutoryComponent = 0;
                    payType = 'Not on SPL / Unpaid';
                }
            }
        }

        if ((leaveType === 'maternity' || leaveType === 'adoption') && results.eligibility.occupationalPayEligible === true) {
            const occPayWeekNum = weekNum;

            if (usesBurgundy) {
                if (occPayWeekNum <= 4) {
                    occupationalComponent = awe;
                    payType = 'Occupational Pay (Burgundy - Full Pay)';
                    notes = '100% Normal Pay';
                } else if (occPayWeekNum <= 6) {
                    occupationalComponent = awe * 0.9;
                    payType = 'Occupational Pay (Burgundy - 90%)';
                    notes = '90% Normal Pay';
                } else if (occPayWeekNum <= 18) {
                    const halfPay = awe * 0.5;
                    const totalPotentialPay = halfPay + statutoryComponent;
                    occupationalComponent = Math.min(totalPotentialPay, awe);
                    payType = 'Occupational Pay (Burgundy - Half Pay + Stat)';
                    notes = '50% Normal Pay + Statutory Pay' + (occupationalComponent < totalPotentialPay ? ' (capped at full pay)' : '');
                }
            } else if (usesGreenBook) {
                if (occPayWeekNum <= 6) {
                    occupationalComponent = awe * 0.9;
                    payType = 'Occupational Pay (Green Book - 90%)';
                    notes = '90% Normal Pay';
                } else if (occPayWeekNum <= 18) {
                    const halfPay = awe * 0.5;
                    const totalPotentialPay = halfPay + statutoryComponent;
                    occupationalComponent = Math.min(totalPotentialPay, awe);
                    payType = 'Occupational Pay (Green Book - Half Pay + Stat)';
                    notes = '50% Normal Pay + Statutory Pay' + (occupationalComponent < totalPotentialPay ? ' (capped at full pay)' : '');
                }
            }

            if (occupationalComponent > 0) {
                weeklyPay = Math.max(occupationalComponent, statutoryComponent);
                if (weeklyPay > statutoryComponent) {
                    occupationalPayAboveStatutoryTotal += (weeklyPay - statutoryComponent);
                }
            } else {
                weeklyPay = statutoryComponent;
            }
        } else {
            weeklyPay = statutoryComponent;
        }

        paySchedule.push({
            weekNum: weekNum,
            startDate: formatISO(currentWeekStartDate, { representation: 'date' }),
            endDate: formatISO(currentWeekEndDate, { representation: 'date' }),
            payType: weeklyPay > 0 ? payType : 'Unpaid',
            amount: weeklyPay,
            notes: notes,
        });
    }

    results.paySchedule = paySchedule;

    if (results.eligibility.occupationalPayEligible === true && (leaveType === 'maternity' || leaveType === 'adoption')) {
        results.notes.push({
            text: `Occupational pay is usually conditional on returning to work (often 3 months). Estimated repayment if you do not return: ${formatCurrency(occupationalPayAboveStatutoryTotal)}.`,
            type: returnIntent === 'no' ? 'warning' : 'info'
        });
        if (returnIntent === 'no') {
            results.estimatedRepayment = occupationalPayAboveStatutoryTotal;
        }
    }

    results.notes.push({
        text: `Employees can undertake KIT/SPLIT days. Discuss with your employer.`, type: 'info'
    })

    return results;
};
