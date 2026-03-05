import Papa from 'papaparse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateText } from '@/lib/ai/gemini';
import type { FinanceTransaction, UploadBudgetResponse, UploadPayrollResponse } from '@/types/finance';

// =====================================================
// CSV PARSER WITH AI HEADER DETECTION
// =====================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface ParsedBudgetData {
  transactions: FinanceTransaction[];
  summary: {
    total_budget: number;
    total_income: number;
    total_expenditure: number;
    categories: string[];
    cost_centres: string[];
  };
}

export interface ParsedPayrollData {
  payroll: any[];
  anomalies: any[];
  summary: {
    total_gross_pay: number;
    total_net_pay: number;
    staff_count: number;
    monthly_total: number;
  };
}

export interface ColumnMapping {
  originalColumn: string;
  mappedColumn: string;
  confidence: number;
}

// =====================================================
// BUDGET CSV PARSER
// =====================================================

export async function parseBudgetCSV(
  file: File,
  budgetId: string,
  schoolId: string,
  organizationId: string,
  academicYear: string
): Promise<ParsedBudgetData> {
  try {
    // Read CSV content
    const csvText = await file.text();
    
    // Parse CSV with PapaParse
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value?.toString().trim()
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing errors:', parseResult.errors);
    }

    const rawData = parseResult.data as Record<string, any>[];
    
    if (rawData.length === 0) {
      throw new Error('No data found in CSV file');
    }

    // Detect column mappings using AI
    const columnMappings = await detectBudgetColumnMappings(rawData[0]);

    // Map data to standard format
    const transactions: FinanceTransaction[] = [];
    let totalBudget = 0;
    let totalIncome = 0;
    let totalExpenditure = 0;
    const categories = new Set<string>();
    const costCentres = new Set<string>();

    rawData.forEach((row, index) => {
      try {
        const transaction = mapBudgetRowToTransaction(
          row,
          columnMappings,
          budgetId,
          schoolId,
          organizationId,
          index
        );

        if (transaction) {
          transactions.push(transaction);
          
          // Update totals
          if (transaction.transaction_type === 'income') {
            totalIncome += transaction.amount;
          } else {
            totalExpenditure += transaction.amount;
          }

          // Track categories and cost centres
          if (transaction.category) {
            categories.add(transaction.category);
          }
          if (transaction.cost_centre) {
            costCentres.add(transaction.cost_centre);
          }
        }
      } catch (error) {
        console.warn(`Error parsing row ${index}:`, error);
      }
    });

    totalBudget = totalIncome + totalExpenditure;

    return {
      transactions,
      summary: {
        total_budget: totalBudget,
        total_income: totalIncome,
        total_expenditure: totalExpenditure,
        categories: Array.from(categories),
        cost_centres: Array.from(costCentres)
      }
    };

  } catch (error) {
    console.error('Error parsing budget CSV:', error);
    throw new Error(`Failed to parse budget CSV: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// =====================================================
// PAYROLL CSV PARSER
// =====================================================

export async function parsePayrollCSV(
  file: File,
  schoolId: string,
  organizationId: string,
  periodMonth: number,
  periodYear: number
): Promise<ParsedPayrollData> {
  try {
    // Read CSV content
    const csvText = await file.text();
    
    // Parse CSV with PapaParse
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value?.toString().trim()
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing errors:', parseResult.errors);
    }

    const rawData = parseResult.data as Record<string, any>[];
    
    if (rawData.length === 0) {
      throw new Error('No data found in CSV file');
    }

    // Detect column mappings using AI
    const columnMappings = await detectPayrollColumnMappings(rawData[0]);

    // Map data to standard format
    const payroll: any[] = [];
    const anomalies: any[] = [];
    let totalGrossPay = 0;
    let totalNetPay = 0;
    const staffCount = rawData.length;

    rawData.forEach((row, index) => {
      try {
        const payrollRecord = mapPayrollRowToRecord(
          row,
          columnMappings,
          schoolId,
          organizationId,
          periodMonth,
          periodYear,
          index
        );

        if (payrollRecord) {
          payroll.push(payrollRecord);
          
          totalGrossPay += payrollRecord.gross_pay || 0;
          totalNetPay += payrollRecord.net_pay || 0;

          // Detect anomalies
          const anomaly = detectPayrollAnomaly(payrollRecord, payroll);
          if (anomaly) {
            anomalies.push(anomaly);
          }
        }
      } catch (error) {
        console.warn(`Error parsing payroll row ${index}:`, error);
      }
    });

    return {
      payroll,
      anomalies,
      summary: {
        total_gross_pay: totalGrossPay,
        total_net_pay: totalNetPay,
        staff_count: staffCount,
        monthly_total: totalGrossPay
      }
    };

  } catch (error) {
    console.error('Error parsing payroll CSV:', error);
    throw new Error(`Failed to parse payroll CSV: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// =====================================================
// AI COLUMN DETECTION
// =====================================================

async function detectBudgetColumnMappings(sampleRow: Record<string, any>): Promise<ColumnMapping[]> {
  const columnNames = Object.keys(sampleRow);
  const sampleValues = Object.values(sampleRow).slice(0, 3); // First 3 values for context

  const prompt = `
You are analyzing a school budget CSV file to map column names to standard finance fields.

Available columns: ${columnNames.join(', ')}
Sample values: ${sampleValues.join(', ')}

Map these columns to the following standard fields:
- transaction_date (date of transaction)
- description (transaction description)
- category (budget category like "Teaching Staff", "Premises", "Supplies")
- cost_centre (cost centre like "Leadership", "Teaching & Learning")
- amount (monetary amount)
- transaction_type (income or expenditure)
- budget_line (specific budget line)
- supplier (supplier name)
- invoice_number (invoice reference)

Return a JSON array of mappings with format:
[
  {"originalColumn": "Column Name", "mappedColumn": "standard_field", "confidence": 0.9}
]

Only map columns you're confident about (confidence > 0.7). If unsure, don't map the column.
`;

  try {
    const text = await generateText(model, prompt);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const mappings = JSON.parse(jsonMatch[0]) as ColumnMapping[];
    return mappings.filter(m => m.confidence > 0.7);

  } catch (error) {
    console.warn('AI column detection failed, using fallback mappings:', error);
    return getFallbackBudgetMappings(columnNames);
  }
}

async function detectPayrollColumnMappings(sampleRow: Record<string, any>): Promise<ColumnMapping[]> {
  const columnNames = Object.keys(sampleRow);
  const sampleValues = Object.values(sampleRow).slice(0, 3);

  const prompt = `
You are analyzing a school payroll CSV file to map column names to standard payroll fields.

Available columns: ${columnNames.join(', ')}
Sample values: ${sampleValues.join(', ')}

Map these columns to the following standard fields:
- staff_name (employee name)
- staff_id (employee ID)
- gross_pay (gross salary amount)
- net_pay (net salary amount)
- pension (pension contribution)
- ni (national insurance)
- tax (tax deduction)
- cost_centre (cost centre)
- role (job role/title)

Return a JSON array of mappings with format:
[
  {"originalColumn": "Column Name", "mappedColumn": "standard_field", "confidence": 0.9}
]

Only map columns you're confident about (confidence > 0.7).
`;

  try {
    const text = await generateText(model, prompt);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const mappings = JSON.parse(jsonMatch[0]) as ColumnMapping[];
    return mappings.filter(m => m.confidence > 0.7);

  } catch (error) {
    console.warn('AI payroll column detection failed, using fallback mappings:', error);
    return getFallbackPayrollMappings(columnNames);
  }
}

// =====================================================
// FALLBACK MAPPINGS
// =====================================================

function getFallbackBudgetMappings(columnNames: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  const commonMappings = [
    { pattern: /date/i, field: 'transaction_date' },
    { pattern: /description|desc/i, field: 'description' },
    { pattern: /category|cat/i, field: 'category' },
    { pattern: /cost.?centre|centre/i, field: 'cost_centre' },
    { pattern: /amount|value|sum/i, field: 'amount' },
    { pattern: /type|kind/i, field: 'transaction_type' },
    { pattern: /supplier|vendor/i, field: 'supplier' },
    { pattern: /invoice|ref/i, field: 'invoice_number' }
  ];

  columnNames.forEach(col => {
    const mapping = commonMappings.find(m => m.pattern.test(col));
    if (mapping) {
      mappings.push({
        originalColumn: col,
        mappedColumn: mapping.field,
        confidence: 0.8
      });
    }
  });

  return mappings;
}

function getFallbackPayrollMappings(columnNames: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  const commonMappings = [
    { pattern: /name|employee/i, field: 'staff_name' },
    { pattern: /id|emp.?id/i, field: 'staff_id' },
    { pattern: /gross|gross.?pay/i, field: 'gross_pay' },
    { pattern: /net|net.?pay/i, field: 'net_pay' },
    { pattern: /pension/i, field: 'pension' },
    { pattern: /ni|national.?insurance/i, field: 'ni' },
    { pattern: /tax/i, field: 'tax' },
    { pattern: /role|job|title/i, field: 'role' }
  ];

  columnNames.forEach(col => {
    const mapping = commonMappings.find(m => m.pattern.test(col));
    if (mapping) {
      mappings.push({
        originalColumn: col,
        mappedColumn: mapping.field,
        confidence: 0.8
      });
    }
  });

  return mappings;
}

// =====================================================
// DATA MAPPING FUNCTIONS
// =====================================================

function mapBudgetRowToTransaction(
  row: Record<string, any>,
  mappings: ColumnMapping[],
  budgetId: string,
  schoolId: string,
  organizationId: string,
  index: number
): FinanceTransaction | null {
  const mappedData: any = {};

  // Apply column mappings
  mappings.forEach(mapping => {
    const value = row[mapping.originalColumn];
    if (value !== undefined && value !== null && value !== '') {
      mappedData[mapping.mappedColumn] = value;
    }
  });

  // Validate required fields
  if (!mappedData.amount || !mappedData.description) {
    console.warn(`Skipping row ${index}: missing required fields`);
    return null;
  }

  // Parse amount
  const amount = parseFloat(mappedData.amount.toString().replace(/[£,\s]/g, ''));
  if (isNaN(amount)) {
    console.warn(`Skipping row ${index}: invalid amount`);
    return null;
  }

  // Determine transaction type
  const transactionType = determineTransactionType(mappedData, amount);

  // Parse date
  const transactionDate = parseDate(mappedData.transaction_date) || new Date().toISOString().split('T')[0];

  return {
    id: `temp-${index}`, // Will be replaced by database
    organization_id: organizationId,
    school_id: schoolId,
    budget_id: budgetId,
    transaction_date: transactionDate,
    description: mappedData.description.toString(),
    category: mappedData.category || 'Other',
    cost_centre: mappedData.cost_centre || 'Other',
    amount: amount,
    transaction_type: transactionType,
    budget_line: mappedData.budget_line,
    supplier: mappedData.supplier,
    invoice_number: mappedData.invoice_number,
    reference: mappedData.reference,
    created_by: undefined, // Will be set by API
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapPayrollRowToRecord(
  row: Record<string, any>,
  mappings: ColumnMapping[],
  schoolId: string,
  organizationId: string,
  periodMonth: number,
  periodYear: number,
  index: number
): any | null {
  const mappedData: any = {};

  // Apply column mappings
  mappings.forEach(mapping => {
    const value = row[mapping.originalColumn];
    if (value !== undefined && value !== null && value !== '') {
      mappedData[mapping.mappedColumn] = value;
    }
  });

  // Validate required fields
  if (!mappedData.staff_name) {
    console.warn(`Skipping payroll row ${index}: missing staff name`);
    return null;
  }

  // Parse amounts
  const grossPay = parseFloat(mappedData.gross_pay?.toString().replace(/[£,\s]/g, '') || '0');
  const netPay = parseFloat(mappedData.net_pay?.toString().replace(/[£,\s]/g, '') || '0');
  const pension = parseFloat(mappedData.pension?.toString().replace(/[£,\s]/g, '') || '0');
  const ni = parseFloat(mappedData.ni?.toString().replace(/[£,\s]/g, '') || '0');
  const tax = parseFloat(mappedData.tax?.toString().replace(/[£,\s]/g, '') || '0');

  return {
    id: `temp-payroll-${index}`,
    organization_id: organizationId,
    school_id: schoolId,
    period_month: periodMonth,
    period_year: periodYear,
    staff_name: mappedData.staff_name.toString(),
    staff_id: mappedData.staff_id,
    gross_pay: grossPay,
    net_pay: netPay,
    pension: pension,
    ni: ni,
    tax: tax,
    cost_centre: mappedData.cost_centre || 'Other',
    budget_line: mappedData.budget_line,
    role: mappedData.role,
    uploaded_by: undefined, // Will be set by API
    uploaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function determineTransactionType(mappedData: any, amount: number): 'income' | 'expenditure' {
  // Check if transaction_type is explicitly set
  if (mappedData.transaction_type) {
    const type = mappedData.transaction_type.toString().toLowerCase();
    if (type.includes('income') || type.includes('credit')) {
      return 'income';
    }
    if (type.includes('expenditure') || type.includes('debit') || type.includes('expense')) {
      return 'expenditure';
    }
  }

  // Check description for keywords
  const description = mappedData.description?.toString().toLowerCase() || '';
  const incomeKeywords = ['income', 'grant', 'funding', 'receipt', 'payment received'];
  const expenditureKeywords = ['expense', 'cost', 'payment', 'invoice', 'bill', 'salary', 'wage'];

  if (incomeKeywords.some(keyword => description.includes(keyword))) {
    return 'income';
  }
  if (expenditureKeywords.some(keyword => description.includes(keyword))) {
    return 'expenditure';
  }

  // Default to expenditure for positive amounts (most common)
  return 'expenditure';
}

function parseDate(dateString: any): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function detectPayrollAnomaly(payrollRecord: any, existingPayroll: any[]): any | null {
  // Check for duplicate staff
  const duplicates = existingPayroll.filter(p => p.staff_name === payrollRecord.staff_name);
  if (duplicates.length > 0) {
    return {
      staff_name: payrollRecord.staff_name,
      issue_type: 'duplicate',
      description: 'Staff member appears multiple times in payroll',
      severity: 'medium'
    };
  }

  // Check for unusually high/low amounts
  if (payrollRecord.gross_pay > 100000) {
    return {
      staff_name: payrollRecord.staff_name,
      issue_type: 'variance',
      amount: payrollRecord.gross_pay,
      description: 'Unusually high gross pay amount',
      severity: 'high'
    };
  }

  if (payrollRecord.gross_pay < 1000 && payrollRecord.staff_name) {
    return {
      staff_name: payrollRecord.staff_name,
      issue_type: 'variance',
      amount: payrollRecord.gross_pay,
      description: 'Unusually low gross pay amount',
      severity: 'medium'
    };
  }

  return null;
}
