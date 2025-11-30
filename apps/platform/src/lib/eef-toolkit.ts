// EEF Teaching and Learning Toolkit - All 33 Strategies
// Source: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit

export interface EEFStrategy {
    id: string;
    name: string;
    monthsProgress: number;
    costRating: 1 | 2 | 3 | 4 | 5; // 1 = very low, 5 = very high
    evidenceStrength: 1 | 2 | 3 | 4 | 5; // 1 = very limited, 5 = very extensive
    category: 'teaching' | 'targeted' | 'wider';
    description: string;
    implementationTips: string[];
    commonMistakes: string[];
    ofstedLinks: string[]; // Links to Ofsted framework areas
    keywords: string[]; // For matching to school data/issues
}

export const eefStrategies: EEFStrategy[] = [
    // HIGH IMPACT STRATEGIES
    {
        id: 'feedback',
        name: 'Feedback',
        monthsProgress: 6,
        costRating: 1,
        evidenceStrength: 5,
        category: 'teaching',
        description: 'Providing information to learners about their performance relative to learning goals, helping redirect actions to achieve the goal.',
        implementationTips: [
            'Focus on task, not the student personally',
            'Be specific about what was done well and what needs improvement',
            'Ensure students have time to act on feedback',
            'Train students to give peer feedback effectively'
        ],
        commonMistakes: [
            'Feedback given too late to be actionable',
            'Too much focus on grades, not improvement',
            'Students not given time to respond to feedback',
            'Feedback not linked to success criteria'
        ],
        ofstedLinks: ['Quality of Education', 'Assessment'],
        keywords: ['marking', 'assessment', 'feedback', 'progress', 'improvement']
    },
    {
        id: 'metacognition',
        name: 'Metacognition and Self-Regulation',
        monthsProgress: 7,
        costRating: 1,
        evidenceStrength: 5,
        category: 'teaching',
        description: 'Teaching pupils specific strategies to set goals, monitor and evaluate their own learning.',
        implementationTips: [
            'Explicitly teach planning, monitoring, and evaluation strategies',
            'Model your own thinking processes aloud',
            'Provide structured opportunities for self-assessment',
            'Use graphic organisers to support planning'
        ],
        commonMistakes: [
            'Assuming students will develop these skills naturally',
            'Not modelling the thinking process explicitly',
            'Focusing only on content, not learning strategies',
            'Not giving time for reflection'
        ],
        ofstedLinks: ['Quality of Education', 'Personal Development'],
        keywords: ['thinking', 'reflection', 'self-assessment', 'planning', 'evaluation', 'independence']
    },
    {
        id: 'reading-comprehension',
        name: 'Reading Comprehension Strategies',
        monthsProgress: 6,
        costRating: 1,
        evidenceStrength: 5,
        category: 'teaching',
        description: 'Teaching specific techniques to help students understand what they read, including inference, summarisation, and questioning.',
        implementationTips: [
            'Use reciprocal reading with clear roles',
            'Teach inference explicitly with think-alouds',
            'Connect reading to prior knowledge',
            'Use graphic organisers for text structure'
        ],
        commonMistakes: [
            'Moving on before comprehension is secured',
            'Not teaching vocabulary alongside comprehension',
            'Over-reliance on comprehension worksheets',
            'Not modelling skilled reading behaviours'
        ],
        ofstedLinks: ['Quality of Education', 'Reading'],
        keywords: ['reading', 'comprehension', 'inference', 'vocabulary', 'phonics', 'literacy']
    },
    {
        id: 'collaborative-learning',
        name: 'Collaborative Learning',
        monthsProgress: 5,
        costRating: 1,
        evidenceStrength: 5,
        category: 'teaching',
        description: 'Students working together on activities or learning tasks in a group small enough for everyone to participate.',
        implementationTips: [
            'Structure tasks so collaboration is necessary',
            'Assign clear roles within groups',
            'Train students in collaboration skills',
            'Mix ability groups for some tasks'
        ],
        commonMistakes: [
            'Groups too large (optimal is 3-4)',
            'No individual accountability',
            'One student does all the work',
            'Task could be done individually'
        ],
        ofstedLinks: ['Quality of Education', 'Behaviour and Attitudes'],
        keywords: ['group work', 'collaboration', 'teamwork', 'discussion', 'talk']
    },
    {
        id: 'oral-language',
        name: 'Oral Language Interventions',
        monthsProgress: 6,
        costRating: 1,
        evidenceStrength: 5,
        category: 'targeted',
        description: 'Approaches that emphasise the importance of spoken language and verbal interaction in the classroom.',
        implementationTips: [
            'Create talk-rich classrooms',
            'Explicitly teach academic vocabulary',
            'Use structured talk activities (e.g., think-pair-share)',
            'Target early years and disadvantaged pupils'
        ],
        commonMistakes: [
            'Not allowing enough talk time',
            'Accepting one-word answers',
            'Not scaffolding academic language',
            'Talking at students, not with them'
        ],
        ofstedLinks: ['Quality of Education', 'Early Years', 'SEND'],
        keywords: ['speaking', 'listening', 'vocabulary', 'oracy', 'communication', 'language', 'EYFS']
    },
    {
        id: 'mastery-learning',
        name: 'Mastery Learning',
        monthsProgress: 5,
        costRating: 1,
        evidenceStrength: 4,
        category: 'teaching',
        description: 'Breaking subject matter into units with clear objectives, students must demonstrate mastery before moving on.',
        implementationTips: [
            'Define clear success criteria for each unit',
            'Provide immediate corrective feedback',
            'Allow time for re-teaching and practice',
            'Use diagnostic assessments'
        ],
        commonMistakes: [
            'Moving on before mastery achieved',
            'Not providing enough practice time',
            'Assessment not matched to objectives',
            'One-size-fits-all pacing'
        ],
        ofstedLinks: ['Quality of Education', 'Assessment'],
        keywords: ['mastery', 'maths', 'White Rose', 'fluency', 'practice', 'assessment']
    },
    {
        id: 'small-group-tuition',
        name: 'Small Group Tuition',
        monthsProgress: 4,
        costRating: 3,
        evidenceStrength: 4,
        category: 'targeted',
        description: 'A teacher or professional educator working with two to five pupils together in a group.',
        implementationTips: [
            'Keep groups to 3-5 students maximum',
            'Target specific gaps in knowledge',
            'Use qualified teachers where possible',
            'Link to classroom learning'
        ],
        commonMistakes: [
            'Groups too large to be effective',
            'Intervention not linked to class curriculum',
            'Using untrained staff',
            'Same students always withdrawn'
        ],
        ofstedLinks: ['Quality of Education', 'SEND', 'Pupil Premium'],
        keywords: ['intervention', 'small group', 'catch-up', 'PP', 'disadvantaged', 'tuition']
    },
    {
        id: 'one-to-one-tuition',
        name: 'One to One Tuition',
        monthsProgress: 5,
        costRating: 5,
        evidenceStrength: 4,
        category: 'targeted',
        description: 'Intensive individual support for struggling learners.',
        implementationTips: [
            'Target specific learning needs',
            'Use trained tutors',
            'Short, focused sessions (30-45 mins)',
            'Connect to classroom curriculum'
        ],
        commonMistakes: [
            'Sessions too long or unfocused',
            'Not addressing root cause of difficulty',
            'Tutor not connected to class teacher',
            'Over-reliance on withdrawal from class'
        ],
        ofstedLinks: ['Quality of Education', 'SEND', 'Pupil Premium'],
        keywords: ['1:1', 'tutor', 'intervention', 'SEND', 'EHC', 'individual']
    },
    {
        id: 'peer-tutoring',
        name: 'Peer Tutoring',
        monthsProgress: 5,
        costRating: 1,
        evidenceStrength: 5,
        category: 'teaching',
        description: 'Learners working in pairs or small groups to provide each other with explicit teaching support.',
        implementationTips: [
            'Train both tutors and tutees',
            'Provide structured materials',
            'Cross-age tutoring can be effective',
            'Monitor and support pairs regularly'
        ],
        commonMistakes: [
            'No training for peer tutors',
            'Unstructured pairing time',
            'Always same students tutoring',
            'Not monitoring interactions'
        ],
        ofstedLinks: ['Quality of Education', 'Personal Development'],
        keywords: ['peer', 'paired', 'buddy', 'mentoring', 'tutoring']
    },
    {
        id: 'homework',
        name: 'Homework',
        monthsProgress: 5, // Secondary. Primary = +2 months
        costRating: 1,
        evidenceStrength: 4,
        category: 'teaching',
        description: 'Tasks given to pupils by teachers to complete outside of usual lessons.',
        implementationTips: [
            'Secondary: link to learning, not busy work',
            'Primary: keep short, focus on reading',
            'Provide feedback on homework',
            'Consider homework clubs for disadvantaged'
        ],
        commonMistakes: [
            'Homework for homeworks sake',
            'Too much homework in primary',
            'No feedback given',
            'Widens disadvantage gap'
        ],
        ofstedLinks: ['Quality of Education', 'Pupil Premium'],
        keywords: ['homework', 'home learning', 'independent', 'practice']
    },
    {
        id: 'phonics',
        name: 'Phonics',
        monthsProgress: 5,
        costRating: 1,
        evidenceStrength: 5,
        category: 'teaching',
        description: 'Systematic teaching of the relationship between sounds and spelling patterns.',
        implementationTips: [
            'Use a validated systematic synthetic phonics programme',
            'Daily, focused sessions',
            'Match books to phonics stage',
            'Rapid intervention for those falling behind'
        ],
        commonMistakes: [
            'Not following programme with fidelity',
            'Books not matched to phonics knowledge',
            'Mixed methods confusing children',
            'Slow pace for struggling readers'
        ],
        ofstedLinks: ['Quality of Education', 'Reading', 'Early Years'],
        keywords: ['phonics', 'reading', 'decoding', 'Little Wandle', 'RWI', 'sounds']
    },
    {
        id: 'teaching-assistants',
        name: 'Teaching Assistant Interventions',
        monthsProgress: 4,
        costRating: 3,
        evidenceStrength: 4,
        category: 'targeted',
        description: 'Using TAs to deliver structured interventions to individuals or small groups.',
        implementationTips: [
            'Train TAs in specific interventions',
            'Link interventions to class learning',
            'TAs should supplement, not replace teacher input',
            'Regular liaison between teacher and TA'
        ],
        commonMistakes: [
            'TAs always work with lowest attainers',
            'No training on interventions',
            'TA work not connected to lessons',
            'Over-scaffolding reducing independence'
        ],
        ofstedLinks: ['Quality of Education', 'SEND', 'Leadership'],
        keywords: ['TA', 'teaching assistant', 'LSA', 'support', 'intervention']
    },
    {
        id: 'behaviour-interventions',
        name: 'Behaviour Interventions',
        monthsProgress: 4,
        costRating: 3,
        evidenceStrength: 4,
        category: 'wider',
        description: 'Approaches to reduce challenging behaviour and support positive engagement.',
        implementationTips: [
            'Focus on prevention, not just response',
            'Teach social and emotional skills explicitly',
            'Consistent whole-school approach',
            'Address underlying causes'
        ],
        commonMistakes: [
            'Reactive rather than proactive',
            'Inconsistent application of policy',
            'Not addressing root causes',
            'Over-reliance on exclusion'
        ],
        ofstedLinks: ['Behaviour and Attitudes', 'Personal Development', 'SEND'],
        keywords: ['behaviour', 'SEMH', 'exclusion', 'suspension', 'attitude', 'engagement']
    },
    {
        id: 'social-emotional-learning',
        name: 'Social and Emotional Learning',
        monthsProgress: 4,
        costRating: 1,
        evidenceStrength: 4,
        category: 'wider',
        description: 'Interventions targeting social and emotional learning, including self-awareness and relationship skills.',
        implementationTips: [
            'Embed in whole-school culture',
            'Explicit teaching of SEL skills',
            'Staff training and modelling',
            'Target universal and targeted approaches'
        ],
        commonMistakes: [
            'Bolt-on PSHE lessons only',
            'Not modelled by adults',
            'No whole-school approach',
            'Ignoring the classroom environment'
        ],
        ofstedLinks: ['Personal Development', 'Behaviour and Attitudes', 'Safeguarding'],
        keywords: ['PSHE', 'wellbeing', 'mental health', 'resilience', 'relationships', 'character']
    },
    {
        id: 'parental-engagement',
        name: 'Parental Engagement',
        monthsProgress: 4,
        costRating: 2,
        evidenceStrength: 4,
        category: 'wider',
        description: 'Strategies to improve parental involvement in their childrens learning.',
        implementationTips: [
            'Focus on learning activities, not just communication',
            'Train parents in how to support at home',
            'Target hard-to-reach families',
            'Regular, accessible communication'
        ],
        commonMistakes: [
            'One-way communication only',
            'Not reaching disadvantaged families',
            'Parents unsure how to help',
            'Homework battles at home'
        ],
        ofstedLinks: ['Quality of Education', 'Personal Development', 'Pupil Premium'],
        keywords: ['parents', 'carers', 'engagement', 'communication', 'home learning']
    },
    {
        id: 'early-years-intervention',
        name: 'Early Years Intervention',
        monthsProgress: 6,
        costRating: 4,
        evidenceStrength: 5,
        category: 'targeted',
        description: 'Approaches that focus on improving outcomes for children in the early years (3-5).',
        implementationTips: [
            'Focus on communication and language',
            'High-quality adult-child interactions',
            'Rich learning environment',
            'Target vocabulary gaps early'
        ],
        commonMistakes: [
            'Over-formal too early',
            'Not enough talk and interaction',
            'Missing early signs of difficulty',
            'Poor transition to Year 1'
        ],
        ofstedLinks: ['Early Years', 'SEND', 'Pupil Premium'],
        keywords: ['EYFS', 'reception', 'nursery', 'early years', 'communication', 'language']
    },
    {
        id: 'extending-school-time',
        name: 'Extending School Time',
        monthsProgress: 3,
        costRating: 3,
        evidenceStrength: 3,
        category: 'wider',
        description: 'Additional time spent in school, including before/after school programmes, summer schools, and extended days.',
        implementationTips: [
            'Target those who need it most',
            'High-quality provision, not just supervision',
            'Focus on academic and enrichment',
            'Consider breakfast clubs for attendance'
        ],
        commonMistakes: [
            'More time but same quality teaching',
            'Not targeted at disadvantaged',
            'Just childcare, not learning',
            'Staff burnout'
        ],
        ofstedLinks: ['Quality of Education', 'Personal Development', 'Pupil Premium'],
        keywords: ['after school', 'breakfast club', 'holiday', 'extended', 'enrichment']
    },
    {
        id: 'arts-participation',
        name: 'Arts Participation',
        monthsProgress: 3,
        costRating: 2,
        evidenceStrength: 3,
        category: 'wider',
        description: 'Participation in artistic and creative activities.',
        implementationTips: [
            'Link arts to academic outcomes',
            'Ensure quality instruction',
            'Target disadvantaged pupils',
            'Connect to cultural capital'
        ],
        commonMistakes: [
            'Arts squeezed out of curriculum',
            'Only for the talented',
            'Not linked to wider learning',
            'Poor quality provision'
        ],
        ofstedLinks: ['Personal Development', 'Cultural Capital'],
        keywords: ['art', 'music', 'drama', 'creative', 'cultural capital', 'enrichment']
    },
    {
        id: 'sports-participation',
        name: 'Sports Participation',
        monthsProgress: 2,
        costRating: 2,
        evidenceStrength: 3,
        category: 'wider',
        description: 'Participation in sports and physical activity programmes.',
        implementationTips: [
            'Focus on engagement, not just competition',
            'Target inactive pupils',
            'Link to health and wellbeing',
            'Use PE premium effectively'
        ],
        commonMistakes: [
            'Only competitive sports',
            'Same pupils always picked',
            'Not reaching inactive children',
            'PE premium not evidenced'
        ],
        ofstedLinks: ['Personal Development', 'Physical Development'],
        keywords: ['PE', 'sport', 'physical', 'health', 'active', 'PE premium']
    },
    {
        id: 'digital-technology',
        name: 'Digital Technology',
        monthsProgress: 4,
        costRating: 4,
        evidenceStrength: 4,
        category: 'teaching',
        description: 'Using technology to support and enhance teaching and learning.',
        implementationTips: [
            'Technology should support pedagogy, not replace it',
            'Train teachers effectively',
            'Consider access for disadvantaged',
            'Use for feedback and assessment'
        ],
        commonMistakes: [
            'Tech for techs sake',
            'Replacing, not supporting teaching',
            'Digital divide for disadvantaged',
            'Poor staff confidence'
        ],
        ofstedLinks: ['Quality of Education', 'Pupil Premium'],
        keywords: ['technology', 'digital', 'iPad', 'computer', 'online', 'software']
    },
    {
        id: 'reducing-class-size',
        name: 'Reducing Class Size',
        monthsProgress: 2,
        costRating: 5,
        evidenceStrength: 3,
        category: 'teaching',
        description: 'Reducing the number of pupils in a teaching group.',
        implementationTips: [
            'Only effective if teaching changes',
            'Very expensive for limited gain',
            'Consider targeted small groups instead',
            'Focus on quality, not just quantity'
        ],
        commonMistakes: [
            'Smaller classes but same teaching',
            'Very high cost, low impact',
            'Resources better spent elsewhere',
            'Assuming smaller = better'
        ],
        ofstedLinks: ['Quality of Education'],
        keywords: ['class size', 'pupil ratio', 'teacher ratio']
    },
    {
        id: 'setting-streaming',
        name: 'Setting and Streaming',
        monthsProgress: -1, // Negative impact!
        costRating: 1,
        evidenceStrength: 4,
        category: 'teaching',
        description: 'Grouping pupils by ability for all or some lessons.',
        implementationTips: [
            'Consider alternatives like mixed-ability with targeted support',
            'If setting, ensure movement between sets',
            'Avoid labelling and low expectations',
            'Monitor impact on disadvantaged'
        ],
        commonMistakes: [
            'Fixed sets with no movement',
            'Lower sets have weaker teaching',
            'Self-fulfilling prophecy',
            'PP pupils over-represented in lower sets'
        ],
        ofstedLinks: ['Quality of Education', 'Pupil Premium'],
        keywords: ['setting', 'streaming', 'ability groups', 'differentiation']
    },
    {
        id: 'repeating-year',
        name: 'Repeating a Year',
        monthsProgress: -4, // Negative impact!
        costRating: 5,
        evidenceStrength: 4,
        category: 'targeted',
        description: 'Holding a student back to repeat a year of schooling.',
        implementationTips: [
            'Avoid if possible - evidence shows harm',
            'Address specific learning gaps instead',
            'Consider targeted interventions',
            'Social and emotional impact significant'
        ],
        commonMistakes: [
            'Assuming more time = better outcomes',
            'Not addressing root causes',
            'Ignoring social/emotional impact',
            'Delaying rather than solving'
        ],
        ofstedLinks: ['Quality of Education', 'SEND'],
        keywords: ['repeat', 'held back', 'retention']
    },
    {
        id: 'within-class-grouping',
        name: 'Within-Class Attainment Grouping',
        monthsProgress: 2,
        costRating: 1,
        evidenceStrength: 3,
        category: 'teaching',
        description: 'Grouping pupils within their class based on current attainment.',
        implementationTips: [
            'Flexible groups that change',
            'High expectations for all groups',
            'Teacher works with all groups',
            'Avoid permanent groupings'
        ],
        commonMistakes: [
            'Fixed groups all year',
            'Teacher always with same group',
            'Lower groups have lower expectations',
            'PP pupils always in lower groups'
        ],
        ofstedLinks: ['Quality of Education', 'Pupil Premium'],
        keywords: ['grouping', 'table groups', 'ability', 'differentiation']
    },
    {
        id: 'individualised-instruction',
        name: 'Individualised Instruction',
        monthsProgress: 4,
        costRating: 2,
        evidenceStrength: 4,
        category: 'teaching',
        description: 'Tailoring teaching and learning to individual pupils needs.',
        implementationTips: [
            'Use assessment to identify specific needs',
            'Adaptive teaching within whole-class approach',
            'Technology can support personalisation',
            'Balance individual and whole-class'
        ],
        commonMistakes: [
            'Three-way differentiation for every lesson',
            'Workload becomes unsustainable',
            'Lowering expectations',
            'Too much individual work, not enough teaching'
        ],
        ofstedLinks: ['Quality of Education', 'SEND', 'Adaptive Teaching'],
        keywords: ['differentiation', 'individual', 'adaptive', 'personalised', 'SEND']
    }
];

// Get strategy by ID
export function getStrategy(id: string): EEFStrategy | undefined {
    return eefStrategies.find(s => s.id === id);
}

// Get strategies by category
export function getStrategiesByCategory(category: 'teaching' | 'targeted' | 'wider'): EEFStrategy[] {
    return eefStrategies.filter(s => s.category === category);
}

// Get high impact strategies (5+ months)
export function getHighImpactStrategies(): EEFStrategy[] {
    return eefStrategies.filter(s => s.monthsProgress >= 5).sort((a, b) => b.monthsProgress - a.monthsProgress);
}

// Search strategies by keywords
export function searchStrategies(query: string): EEFStrategy[] {
    const lowerQuery = query.toLowerCase();
    return eefStrategies.filter(s => 
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery) ||
        s.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
}

// Get strategies relevant to a specific issue
export function getRelevantStrategies(issue: string): EEFStrategy[] {
    const keywords = issue.toLowerCase().split(' ');
    return eefStrategies
        .map(s => ({
            strategy: s,
            score: s.keywords.filter(k => keywords.some(w => k.includes(w) || w.includes(k))).length
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.strategy);
}

