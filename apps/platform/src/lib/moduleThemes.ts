export interface ModuleTheme {
    name: string;
    slug: string;
    accentHex: string;
    outcome: string;
}

export const moduleThemes: Record<string, ModuleTheme> = {
    improvement: {
        name: 'School Improvement',
        slug: 'improvement',
        accentHex: '#6366f1', // Indigo 500
        outcome: 'Evidence, actions, narrative—ready anytime.'
    },
    compliance: {
        name: 'Compliance',
        slug: 'compliance',
        accentHex: '#a855f7', // Purple 500
        outcome: 'Statutory checks, policies, reporting—without chaos.'
    },
    estates: {
        name: 'Estates',
        slug: 'estates',
        accentHex: '#0d9488', // Teal 600
        outcome: 'Jobs, assets, compliance—kept on track.'
    },
    finance: {
        name: 'Finance',
        slug: 'finance',
        accentHex: '#f59e0b', // Amber 500
        outcome: 'Spend visibility, anomalies, better decisions.'
    },
    hr: {
        name: 'HR & People',
        slug: 'hr',
        accentHex: '#0ea5e9', // Sky 500
        outcome: 'Performance, absence, workflows—supported.'
    },
    send: {
        name: 'SEND',
        slug: 'send',
        accentHex: '#22c55e', // Green 500
        outcome: 'Provision, plans, evidence—organised.'
    }
};

export const getModuleVars = (slug: string) => {
    const theme = moduleThemes[slug];
    if (!theme) return {};

    return {
        '--module-accent': theme.accentHex,
        '--module-accent-soft': `${theme.accentHex}20`,
        '--module-accent-glow': `${theme.accentHex}10`,
    } as React.CSSProperties;
};
