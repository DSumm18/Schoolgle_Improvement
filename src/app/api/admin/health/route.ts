import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Calculate health score for all organizations
export async function POST(req: NextRequest) {
    try {
        // Get all organizations with subscriptions
        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select(`
                id,
                name,
                subscriptions!inner (
                    id,
                    status,
                    plan
                )
            `)
            .eq('subscriptions.status', 'active');

        if (orgsError) throw orgsError;

        const results = [];

        for (const org of orgs || []) {
            // Get usage stats for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: usageData } = await supabase
                .from('usage_daily_summary')
                .select('*')
                .eq('organization_id', org.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

            // Get last login
            const { data: lastLogin } = await supabase
                .from('usage_events')
                .select('created_at')
                .eq('organization_id', org.id)
                .eq('event_type', 'login')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Get unique users who logged in last 30 days
            const { data: activeUsers } = await supabase
                .from('usage_events')
                .select('user_id')
                .eq('organization_id', org.id)
                .eq('event_type', 'login')
                .gte('created_at', thirtyDaysAgo.toISOString());

            // Get total users in org
            const { count: totalUsers } = await supabase
                .from('organization_members')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', org.id);

            // Get action completion rate
            const { data: actions } = await supabase
                .from('actions')
                .select('status')
                .eq('organization_id', org.id);

            // Calculate metrics
            const daysActive = usageData?.length || 0;
            const totalAiCost = usageData?.reduce((sum, d) => sum + (parseFloat(d.ai_total_cost_usd) || 0), 0) || 0;
            const totalAiQueries = usageData?.reduce((sum, d) => sum + (d.ai_chats || 0), 0) || 0;
            const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id)).size;
            const activeUsersPercent = totalUsers ? (uniqueActiveUsers / totalUsers) * 100 : 0;
            
            const completedActions = actions?.filter(a => a.status === 'completed').length || 0;
            const totalActions = actions?.length || 1;
            const completionRate = (completedActions / totalActions) * 100;

            const daysSinceLogin = lastLogin 
                ? Math.floor((Date.now() - new Date(lastLogin.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 999;

            // Calculate feature usage count
            const featuresUsed = usageData?.reduce((features, d) => {
                if (d.ai_chats > 0) features.add('ai_chat');
                if (d.reports_generated > 0) features.add('reports');
                if (d.actions_created > 0) features.add('actions');
                if (d.voice_observations > 0) features.add('voice');
                if (d.mock_inspections > 0) features.add('mock_inspector');
                if (d.documents_uploaded > 0) features.add('documents');
                return features;
            }, new Set()).size || 0;

            // Calculate scores
            // Engagement: Based on days active and login recency
            let engagementScore = Math.min(100, 
                (daysActive * 3) + // Up to 90 points for daily usage
                (daysSinceLogin < 3 ? 30 : daysSinceLogin < 7 ? 20 : daysSinceLogin < 14 ? 10 : 0) // Recency bonus
            );

            // Adoption: Based on features used and active users
            let adoptionScore = Math.min(100,
                (featuresUsed * 15) + // Up to 90 points for 6 features
                (activeUsersPercent * 0.5) // Up to 50 points for 100% user adoption
            );

            // Value: Based on action completion and AI usage
            let valueScore = Math.min(100,
                (completionRate * 0.5) + // Up to 50 points for completion
                (totalAiQueries > 0 ? 30 : 0) + // Using AI
                (Math.min(20, daysActive)) // Consistent usage
            );

            // Overall health score (weighted average)
            const healthScore = Math.round(
                (engagementScore * 0.4) + 
                (adoptionScore * 0.3) + 
                (valueScore * 0.3)
            );

            // Determine status
            let healthStatus: string;
            const riskFlags: string[] = [];

            if (daysSinceLogin > 30) {
                riskFlags.push('No login for 30+ days');
            }
            if (daysSinceLogin > 14) {
                riskFlags.push('No login for 14+ days');
            }
            if (activeUsersPercent < 20) {
                riskFlags.push('Low user adoption');
            }
            if (completionRate < 20) {
                riskFlags.push('Low action completion');
            }
            if (featuresUsed < 2) {
                riskFlags.push('Limited feature usage');
            }

            if (healthScore >= 70) {
                healthStatus = 'healthy';
            } else if (healthScore >= 50) {
                healthStatus = 'neutral';
            } else if (healthScore >= 30) {
                healthStatus = 'at_risk';
            } else {
                healthStatus = 'critical';
            }

            // Upsert health record
            await supabase
                .from('customer_health')
                .upsert({
                    organization_id: org.id,
                    health_score: healthScore,
                    health_status: healthStatus,
                    engagement_score: Math.round(engagementScore),
                    adoption_score: Math.round(adoptionScore),
                    value_score: Math.round(valueScore),
                    days_since_last_login: daysSinceLogin,
                    logins_last_30_days: daysActive,
                    active_users_percent: activeUsersPercent,
                    features_used_count: featuresUsed,
                    actions_completion_rate: completionRate,
                    ai_spend_last_30_days: totalAiCost,
                    ai_queries_last_30_days: totalAiQueries,
                    risk_flags: riskFlags,
                    last_login_at: lastLogin?.created_at || null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'organization_id'
                });

            results.push({
                organizationId: org.id,
                name: org.name,
                healthScore,
                healthStatus,
                riskFlags
            });
        }

        return NextResponse.json({ 
            success: true, 
            processed: results.length,
            results 
        });
    } catch (error: any) {
        console.error('Error calculating health scores:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get health data for admin dashboard
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query = supabase
            .from('customer_health')
            .select(`
                *,
                organization:organizations (
                    id,
                    name
                )
            `)
            .order('health_score', { ascending: true });

        if (status && status !== 'all') {
            query = query.eq('health_status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error fetching health data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

