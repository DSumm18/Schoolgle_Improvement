import { supabase } from '@/lib/supabase/client';
import type {
  FinanceBudget,
  FinanceTransaction,
  FinancePayroll,
  FinanceVarianceAnalysis,
  FinanceAction,
  FinanceScenario,
  FinanceFundingStream,
  FinanceBenchmark,
  FinanceFilters,
  UploadBudgetRequest,
  UploadPayrollRequest,
  GenerateScenarioRequest,
  VarianceNarrativeRequest
} from '@/types/finance';

// =====================================================
// FINANCE BUDGETS
// =====================================================

export async function getFinanceBudgets(
  schoolId: string,
  organizationId: string,
  academicYear?: string
): Promise<FinanceBudget[]> {
  let query = supabase
    .from('finance_budgets')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (academicYear) {
    query = query.eq('academic_year', academicYear);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance budgets:', error);
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }

  return data || [];
}

export async function createFinanceBudget(
  budget: Omit<FinanceBudget, 'id' | 'created_at' | 'updated_at'>
): Promise<FinanceBudget> {
  const { data, error } = await supabase
    .from('finance_budgets')
    .insert([budget])
    .select()
    .single();

  if (error) {
    console.error('Error creating finance budget:', error);
    throw new Error(`Failed to create budget: ${error.message}`);
  }

  return data;
}

export async function updateFinanceBudget(
  id: string,
  updates: Partial<FinanceBudget>
): Promise<FinanceBudget> {
  const { data, error } = await supabase
    .from('finance_budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating finance budget:', error);
    throw new Error(`Failed to update budget: ${error.message}`);
  }

  return data;
}

// =====================================================
// FINANCE TRANSACTIONS
// =====================================================

export async function getFinanceTransactions(
  schoolId: string,
  organizationId: string,
  filters?: FinanceFilters
): Promise<FinanceTransaction[]> {
  let query = supabase
    .from('finance_transactions')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('transaction_date', { ascending: false });

  if (filters) {
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.cost_centre) {
      query = query.eq('cost_centre', filters.cost_centre);
    }
    if (filters.date_from) {
      query = query.gte('transaction_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('transaction_date', filters.date_to);
    }
    if (filters.amount_min) {
      query = query.gte('amount', filters.amount_min);
    }
    if (filters.amount_max) {
      query = query.lte('amount', filters.amount_max);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
}

export async function createFinanceTransactions(
  transactions: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>[]
): Promise<FinanceTransaction[]> {
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('Error creating finance transactions:', error);
    throw new Error(`Failed to create transactions: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// FINANCE PAYROLL
// =====================================================

export async function getFinancePayroll(
  schoolId: string,
  organizationId: string,
  periodYear?: number,
  periodMonth?: number
): Promise<FinancePayroll[]> {
  let query = supabase
    .from('finance_payroll')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (periodYear) {
    query = query.eq('period_year', periodYear);
  }
  if (periodMonth) {
    query = query.eq('period_month', periodMonth);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance payroll:', error);
    throw new Error(`Failed to fetch payroll: ${error.message}`);
  }

  return data || [];
}

export async function createFinancePayroll(
  payroll: Omit<FinancePayroll, 'id' | 'created_at' | 'updated_at'>[]
): Promise<FinancePayroll[]> {
  const { data, error } = await supabase
    .from('finance_payroll')
    .insert(payroll)
    .select();

  if (error) {
    console.error('Error creating finance payroll:', error);
    throw new Error(`Failed to create payroll: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// FINANCE VARIANCE ANALYSIS
// =====================================================

export async function getFinanceVarianceAnalysis(
  schoolId: string,
  organizationId: string,
  budgetId?: string
): Promise<FinanceVarianceAnalysis[]> {
  let query = supabase
    .from('finance_variance_analysis')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('variance_percent', { ascending: false });

  if (budgetId) {
    query = query.eq('budget_id', budgetId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance variance analysis:', error);
    throw new Error(`Failed to fetch variance analysis: ${error.message}`);
  }

  return data || [];
}

export async function createFinanceVarianceAnalysis(
  variance: Omit<FinanceVarianceAnalysis, 'id' | 'created_at' | 'updated_at'>
): Promise<FinanceVarianceAnalysis> {
  const { data, error } = await supabase
    .from('finance_variance_analysis')
    .insert([variance])
    .select()
    .single();

  if (error) {
    console.error('Error creating finance variance analysis:', error);
    throw new Error(`Failed to create variance analysis: ${error.message}`);
  }

  return data;
}

// =====================================================
// FINANCE ACTIONS
// =====================================================

export async function getFinanceActions(
  schoolId: string,
  organizationId: string,
  status?: string
): Promise<FinanceAction[]> {
  let query = supabase
    .from('finance_actions')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance actions:', error);
    throw new Error(`Failed to fetch actions: ${error.message}`);
  }

  return data || [];
}

export async function createFinanceAction(
  action: Omit<FinanceAction, 'id' | 'created_at' | 'updated_at'>
): Promise<FinanceAction> {
  const { data, error } = await supabase
    .from('finance_actions')
    .insert([action])
    .select()
    .single();

  if (error) {
    console.error('Error creating finance action:', error);
    throw new Error(`Failed to create action: ${error.message}`);
  }

  return data;
}

export async function updateFinanceAction(
  id: string,
  updates: Partial<FinanceAction>
): Promise<FinanceAction> {
  const { data, error } = await supabase
    .from('finance_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating finance action:', error);
    throw new Error(`Failed to update action: ${error.message}`);
  }

  return data;
}

// =====================================================
// FINANCE SCENARIOS
// =====================================================

export async function getFinanceScenarios(
  schoolId: string,
  organizationId: string,
  createdBy?: string
): Promise<FinanceScenario[]> {
  let query = supabase
    .from('finance_scenarios')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance scenarios:', error);
    throw new Error(`Failed to fetch scenarios: ${error.message}`);
  }

  return data || [];
}

export async function createFinanceScenario(
  scenario: Omit<FinanceScenario, 'id' | 'created_at' | 'updated_at'>
): Promise<FinanceScenario> {
  const { data, error } = await supabase
    .from('finance_scenarios')
    .insert([scenario])
    .select()
    .single();

  if (error) {
    console.error('Error creating finance scenario:', error);
    throw new Error(`Failed to create scenario: ${error.message}`);
  }

  return data;
}

// =====================================================
// FINANCE FUNDING STREAMS
// =====================================================

export async function getFinanceFundingStreams(
  schoolId: string,
  organizationId: string,
  academicYear?: string
): Promise<FinanceFundingStream[]> {
  let query = supabase
    .from('finance_funding_streams')
    .select('*')
    .eq('school_id', schoolId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (academicYear) {
    query = query.eq('academic_year', academicYear);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance funding streams:', error);
    throw new Error(`Failed to fetch funding streams: ${error.message}`);
  }

  return data || [];
}

export async function createFinanceFundingStreams(
  streams: Omit<FinanceFundingStream, 'id' | 'created_at' | 'updated_at'>[]
): Promise<FinanceFundingStream[]> {
  const { data, error } = await supabase
    .from('finance_funding_streams')
    .insert(streams)
    .select();

  if (error) {
    console.error('Error creating finance funding streams:', error);
    throw new Error(`Failed to create funding streams: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// FINANCE BENCHMARKS
// =====================================================

export async function getFinanceBenchmarks(
  schoolPhase?: string,
  region?: string,
  dataSource?: string
): Promise<FinanceBenchmark[]> {
  let query = supabase
    .from('finance_benchmarks')
    .select('*')
    .order('updated_at', { ascending: false });

  if (schoolPhase) {
    query = query.eq('school_phase', schoolPhase);
  }
  if (region) {
    query = query.eq('region', region);
  }
  if (dataSource) {
    query = query.eq('data_source', dataSource);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finance benchmarks:', error);
    throw new Error(`Failed to fetch benchmarks: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// ANALYTICS AND AGGREGATIONS
// =====================================================

export async function getFinanceKPIs(
  schoolId: string,
  organizationId: string,
  academicYear?: string
): Promise<any> {
  // Get current budget
  const budgets = await getFinanceBudgets(schoolId, organizationId, academicYear);
  const currentBudget = budgets.find(b => b.status === 'active') || budgets[0];

  if (!currentBudget) {
    return {
      total_budget: 0,
      ytd_spend: 0,
      ytd_income: 0,
      variance_percent: 0,
      top_variance_category: 'N/A',
      top_variance_amount: 0,
      actions_pending: 0,
      scenarios_saved: 0
    };
  }

  // Get transactions
  const transactions = await getFinanceTransactions(schoolId, organizationId);
  const budgetTransactions = transactions.filter(t => t.budget_id === currentBudget.id);

  // Calculate KPIs
  const totalBudget = currentBudget.total_budget;
  const ytdSpend = budgetTransactions
    .filter(t => t.transaction_type === 'expenditure')
    .reduce((sum, t) => sum + t.amount, 0);
  const ytdIncome = budgetTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const variancePercent = totalBudget > 0 ? ((ytdSpend - totalBudget) / totalBudget) * 100 : 0;

  // Get variance analysis
  const variances = await getFinanceVarianceAnalysis(schoolId, organizationId, currentBudget.id);
  const topVariance = variances.reduce((max, v) => 
    Math.abs(v.variance_percent) > Math.abs(max.variance_percent) ? v : max, 
    variances[0] || { category: 'N/A', variance_percent: 0 }
  );

  // Get pending actions
  const actions = await getFinanceActions(schoolId, organizationId, 'pending');
  const scenarios = await getFinanceScenarios(schoolId, organizationId);

  return {
    total_budget: totalBudget,
    ytd_spend: ytdSpend,
    ytd_income: ytdIncome,
    variance_percent: variancePercent,
    top_variance_category: topVariance.category,
    top_variance_amount: topVariance.variance_percent,
    actions_pending: actions.length,
    scenarios_saved: scenarios.length
  };
}

export async function getBudgetOverviewData(
  schoolId: string,
  organizationId: string,
  budgetId: string
): Promise<any[]> {
  const transactions = await getFinanceTransactions(schoolId, organizationId);
  const budgetTransactions = transactions.filter(t => t.budget_id === budgetId);

  // Group by category
  const categoryData: Record<string, { budgeted: number; actual: number }> = {};

  budgetTransactions.forEach(transaction => {
    if (!categoryData[transaction.category]) {
      categoryData[transaction.category] = { budgeted: 0, actual: 0 };
    }

    if (transaction.transaction_type === 'expenditure') {
      categoryData[transaction.category].actual += transaction.amount;
    }
  });

  // Convert to array format
  return Object.entries(categoryData).map(([category, data]) => ({
    category,
    budgeted: data.budgeted,
    actual: data.actual,
    variance: data.actual - data.budgeted,
    variance_percent: data.budgeted > 0 ? ((data.actual - data.budgeted) / data.budgeted) * 100 : 0,
    trend: data.actual > data.budgeted ? 'up' : data.actual < data.budgeted ? 'down' : 'stable'
  }));
}

// =====================================================
// FILE UPLOAD HELPERS
// =====================================================

export async function uploadBudgetFile(
  file: File,
  budgetData: UploadBudgetRequest
): Promise<string> {
  const fileName = `budget-${Date.now()}-${file.name}`;
  const filePath = `finance-uploads/${budgetData.academic_year}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('finance-files')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading budget file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
}

export async function uploadPayrollFile(
  file: File,
  payrollData: UploadPayrollRequest
): Promise<string> {
  const fileName = `payroll-${payrollData.period_year}-${payrollData.period_month}-${Date.now()}-${file.name}`;
  const filePath = `finance-uploads/payroll/${fileName}`;

  const { data, error } = await supabase.storage
    .from('finance-files')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading payroll file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
}
