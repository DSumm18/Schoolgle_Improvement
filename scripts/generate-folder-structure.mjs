import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Framework data
const OFSTED_CATEGORIES = [
    {
        name: 'Inclusion',
        subcategories: [
            {
                name: 'SEND Provision',
                evidence: ['SEND Policy', 'Graduated Approach', 'Provision Map', 'EHCP Reviews', 'SENCO Role']
            },
            {
                name: 'Disadvantaged Pupils',
                evidence: ['Pupil Premium Strategy', 'PP Outcomes', 'Intervention Impact', 'Attendance Data']
            },
            {
                name: 'Mental Health & Wellbeing Support',
                evidence: ['Mental Health Lead', 'Wellbeing Curriculum', 'Support Systems', 'Staff Training']
            }
        ]
    },
    {
        name: 'Curriculum and Teaching',
        subcategories: [
            {
                name: 'Curriculum Intent',
                evidence: ['Curriculum Overview', 'Subject Policies', 'Progression Maps', 'Cultural Capital']
            },
            {
                name: 'Teaching Quality',
                evidence: ['Lesson Observations', 'Work Scrutiny', 'Assessment Policy', 'CPD Records', 'Feedback Policy']
            },
            {
                name: 'Reading and Literacy',
                evidence: ['Phonics Programme', 'Reading Curriculum', 'Book Matching', 'Intervention Data', 'Phonics Results']
            }
        ]
    },
    {
        name: 'Achievement',
        subcategories: [
            {
                name: 'Academic Outcomes',
                evidence: ['KS2 Results', 'Phonics Results', 'EYFS Outcomes', 'Progress Data', 'Group Analysis']
            },
            {
                name: 'Progress from Starting Points',
                evidence: ['Baseline Data', 'Progress Measures', 'Value Added', 'Cohort Analysis']
            },
            {
                name: 'Preparation for Next Stage',
                evidence: ['Transition Data', 'Secondary Ready', 'Careers Guidance']
            }
        ]
    },
    {
        name: 'Attendance and Behaviour',
        subcategories: [
            {
                name: 'Attendance',
                evidence: ['Attendance Data', 'PA Data', 'Attendance Policy', 'Intervention Evidence', 'Group Breakdown']
            },
            {
                name: 'Behaviour and Conduct',
                evidence: ['Behaviour Policy', 'Exclusion Data', 'Behaviour Logs', 'Restorative Approaches']
            },
            {
                name: 'Attitudes to Learning',
                evidence: ['Pupil Voice', 'Lesson Observations', 'Work Scrutiny']
            }
        ]
    },
    {
        name: 'Personal Development and Well-being',
        subcategories: [
            {
                name: 'Character and Resilience',
                evidence: ['Character Education', 'PSHE Curriculum', 'Pupil Leadership']
            },
            {
                name: 'Citizenship and British Values',
                evidence: ['British Values Mapping', 'Democracy', 'Rule of Law', 'Tolerance']
            },
            {
                name: 'Enrichment and Wider Opportunities',
                evidence: ['Enrichment Offer', 'Participation Data', 'Cultural Capital']
            },
            {
                name: 'RSE and Health Education',
                evidence: ['RSE Policy', 'RSE Curriculum', 'Parent Consultation']
            }
        ]
    },
    {
        name: 'Leadership and Governance',
        subcategories: [
            {
                name: 'Vision and Strategy',
                evidence: ['Vision Statement', 'School Development Plan', 'Self-Evaluation']
            },
            {
                name: 'Governance',
                evidence: ['Governor Minutes', 'Governor Training', 'Monitoring Visits']
            },
            {
                name: 'Staff Development and Wellbeing',
                evidence: ['CPD Programme', 'Workload Policy', 'Staff Voice']
            },
            {
                name: 'Parent and Community Engagement',
                evidence: ['Parent Survey', 'Communication', 'Complaints']
            }
        ]
    }
];

const SAFEGUARDING_REQUIREMENTS = [
    'Safeguarding Policy',
    'Single Central Record',
    'DSL Arrangements',
    'Staff Training',
    'Referral Procedures',
    'Safer Recruitment',
    'CPOMS/Recording',
    'Prevent Duty',
    'Online Safety',
    'Site Security'
];

const SIAMS_STRANDS = [
    {
        name: 'Vision and Leadership',
        questions: [
            { id: 'vision-1', evidence: ['Vision statement', 'School website', 'Policies referencing vision', 'Staff understanding'] },
            { id: 'vision-2', evidence: ['School Development Plan', 'Strategic priorities', 'Governor minutes'] },
            { id: 'vision-3', evidence: ['Leadership interviews', 'Decision-making processes', 'Staff feedback'] },
            { id: 'vision-4', evidence: ['Governor meeting minutes', 'Governor training records', 'Challenge evidence'] }
        ]
    },
    {
        name: 'Wisdom, Knowledge and Skills',
        questions: [
            { id: 'wisdom-1', evidence: ['Curriculum overview', 'Subject policies', 'Long-term plans'] },
            { id: 'wisdom-2', evidence: ['SMSC mapping', 'Lesson observations', 'Pupil work'] },
            { id: 'wisdom-3', evidence: ['British Values mapping', 'PSHE curriculum', 'Pupil understanding'] },
            { id: 'wisdom-4', evidence: ['Attainment data', 'Progress data', 'Disadvantaged outcomes'] }
        ]
    },
    {
        name: 'Character Development',
        questions: [
            { id: 'character-1', evidence: ['Character education programme', 'Behaviour policy', 'Recognition systems'] },
            { id: 'character-2', evidence: ['Pupil voice', 'Destination data', 'Careers education'] },
            { id: 'character-3', evidence: ['Charity work', 'Community projects', 'Pupil leadership'] },
            { id: 'character-4', evidence: ['RE lessons', 'PSHE', 'Pupil discussions', 'Behaviour evidence'] }
        ]
    },
    {
        name: 'Community and Living Well Together',
        questions: [
            { id: 'community-1', evidence: ['Behaviour policy', 'Restorative approaches', 'Staff/pupil relationships'] },
            { id: 'community-2', evidence: ['Wellbeing policy', 'Support systems', 'Staff wellbeing'] },
            { id: 'community-3', evidence: ['Church links', 'Parent engagement', 'Community partnerships'] },
            { id: 'community-4', evidence: ['Inclusion policy', 'SEND provision', 'Vulnerable groups support'] }
        ]
    },
    {
        name: 'Dignity and Respect',
        questions: [
            { id: 'dignity-1', evidence: ['Equality policy', 'Anti-bullying policy', 'Incident records'] },
            { id: 'dignity-2', evidence: ['Discrimination incidents', 'Response procedures', 'Training records'] },
            { id: 'dignity-3', evidence: ['Curriculum coverage', 'Pupil voice', 'Displays and resources'] },
            { id: 'dignity-4', evidence: ['RSE curriculum', 'PSHE coverage', 'Staff training'] }
        ]
    },
    {
        name: 'Impact of Collective Worship',
        questions: [
            { id: 'worship-1', evidence: ['Worship timetable', 'Worship policy', 'Planning documents'] },
            { id: 'worship-2', evidence: ['Worship themes', 'Use of liturgy', 'Christian calendar'] },
            { id: 'worship-3', evidence: ['Withdrawal procedures', 'Inclusive language', 'Visitor feedback'] },
            { id: 'worship-4', evidence: ['Pupil-led worship', 'Prayer spaces', 'Pupil voice on worship'] },
            { id: 'worship-5', evidence: ['Reflection opportunities', 'Impact evidence', 'Spiritual development'] }
        ]
    },
    {
        name: 'Effectiveness of Religious Education',
        questions: [
            { id: 're-1', evidence: ['RE policy', 'Curriculum overview', 'Statement of Entitlement audit'] },
            { id: 're-2', evidence: ['Lesson observations', 'Pupil work', 'Teacher subject knowledge'] },
            { id: 're-3', evidence: ['RE assessment data', 'Progress tracking', 'GCSE results if applicable'] },
            { id: 're-4', evidence: ['Curriculum coverage', 'World religion content', 'Pupil understanding'] },
            { id: 're-5', evidence: ['Discussion evidence', 'Written work', 'Pupil voice'] }
        ]
    }
];

function sanitizeFolderName(name) {
    return name
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

function generateFolders(config) {
    const folders = [];
    
    // Ofsted structure
    if (config.ofsted) {
        OFSTED_CATEGORIES.forEach((category, catIndex) => {
            const catNum = String(catIndex + 1).padStart(2, '0');
            const catPath = `01_Ofsted_Evidence/${catNum}_${sanitizeFolderName(category.name)}`;
            folders.push(catPath + '/');
            
            category.subcategories.forEach((sub) => {
                const subPath = `${catPath}/${sanitizeFolderName(sub.name)}`;
                folders.push(subPath + '/');
                
                sub.evidence.forEach((evidence) => {
                    folders.push(`${subPath}/${sanitizeFolderName(evidence)}/`);
                });
            });
        });
        
        // Safeguarding
        const sgPath = '01_Ofsted_Evidence/07_Safeguarding';
        folders.push(sgPath + '/');
        SAFEGUARDING_REQUIREMENTS.forEach((req) => {
            folders.push(`${sgPath}/${sanitizeFolderName(req)}/`);
        });
    }
    
    // SIAMS structure
    if (config.siams) {
        SIAMS_STRANDS.forEach((strand, strandIndex) => {
            const strandNum = String(strandIndex + 1).padStart(2, '0');
            const strandPath = `02_SIAMS_Evidence/${strandNum}_${sanitizeFolderName(strand.name)}`;
            folders.push(strandPath + '/');
            
            strand.questions.forEach((question, qIndex) => {
                const qNum = String(qIndex + 1).padStart(2, '0');
                const qPath = `${strandPath}/${qNum}_${sanitizeFolderName(question.id)}`;
                folders.push(qPath + '/');
                
                question.evidence.forEach((evidence, eIndex) => {
                    const eNum = String(eIndex + 1).padStart(2, '0');
                    folders.push(`${qPath}/${eNum}_${sanitizeFolderName(evidence)}/`);
                });
            });
        });
    }
    
    // Shared evidence
    folders.push('00_Shared_Evidence/');
    
    return folders.sort();
}

function generateReadme(config) {
    const frameworks = [];
    if (config.ofsted) frameworks.push('Ofsted');
    if (config.siams) frameworks.push('SIAMS (Anglican/Methodist)');
    
    return `# Schoolgle Evidence Folder Structure

## Inspection Frameworks Included

This folder structure has been generated for:
${frameworks.map(f => `- ${f}`).join('\n')}

## Instructions

### 1. Extract This Folder Structure

**For Google Drive:**
1. Extract this ZIP file on your computer
2. Open Google Drive in your browser
3. Upload the extracted folder to your preferred location
4. The folder structure will be created in your Drive

**For OneDrive:**
1. Extract this ZIP file on your computer
2. Open OneDrive in your browser or File Explorer
3. Upload the extracted folder to your preferred location
4. The folder structure will be created in your OneDrive

**For Local Storage:**
1. Extract this ZIP file to your evidence storage location
2. The folder structure is ready to use

### 2. Organize Your Evidence

- Drop your evidence files into the appropriate subfolders
- Each folder corresponds to a specific inspection requirement
- You can create additional subfolders within each category if needed

### 3. Scan with Schoolgle

1. Connect your Google Drive or OneDrive account in Schoolgle
2. Use the "Scan Evidence" feature
3. Select the evidence folder (or specific subfolder)
4. Schoolgle will automatically match your evidence to inspection requirements

## Tips

- Keep evidence files clearly named (e.g., "SEND_Policy_2024.pdf")
- Add dates to files when relevant
- Store multiple years of evidence if needed
- Use the "Shared Evidence" folder for documents relevant to multiple frameworks

---
Generated by Schoolgle on ${new Date().toLocaleDateString('en-GB')}
`;
}

async function createZip(config, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            console.log(`✅ ZIP file created: ${outputPath}`);
            console.log(`   Total size: ${archive.pointer()} bytes`);
            resolve(outputPath);
        });
        
        archive.on('error', reject);
        archive.pipe(output);
        
        // Create folder structure
        const folders = generateFolders(config);
        folders.forEach((folder) => {
            archive.append('', { name: folder + '.gitkeep' });
        });
        
        // Add README
        const readme = generateReadme(config);
        archive.append(readme, { name: 'README.md' });
        
        archive.finalize();
    });
}

// Main execution
const config = {
    ofsted: true,
    siams: true
};

const outputPath = path.join(__dirname, 'Schoolgle_Evidence_Structure.zip');

console.log('📦 Generating folder structure ZIP file...');
console.log(`   Frameworks: ${config.ofsted ? 'Ofsted' : ''} ${config.siams ? 'SIAMS' : ''}`);

createZip(config, outputPath)
    .then(() => {
        console.log('\n✨ Done! You can find the ZIP file at:');
        console.log(`   ${outputPath}`);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

