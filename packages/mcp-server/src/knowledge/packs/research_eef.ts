/**
 * Knowledge Pack: EEF Research (Pilot v1)
 * 
 * Education Endowment Foundation Research Evidence
 * 
 * IMPORTANT PRINCIPLES:
 * - EEF does NOT detect gaps (gaps come from frameworks)
 * - EEF is used only to justify, explain, and contextualise actions
 * - EEF is advisory, not prescriptive
 * - Use "EEF evidence suggests..." never "EEF requires"
 * - No hallucinated research - all entries must be structured, cited, and reviewable
 * - If content is unknown, use placeholders clearly marked TBD
 * - Framework-agnostic (works for SEND, HR CPD, leadership, behaviour, etc.)
 * 
 * This is a PILOT pack with 10-15 starter entries, structure-first, content-light.
 * DO NOT fabricate findings. Use placeholders where exact wording is unknown.
 */

import type { KnowledgePack, Rule } from '../schema.js';

export const EEF_PACK: KnowledgePack = {
  id: 'eef-research-v1',
  domain: 'research',
  title: 'Education Endowment Foundation - Research Evidence',
  version: '1.0',
  effective_date: '2024-01-01',
  review_by_date: '2025-12-31', // Review annually as EEF publishes updates
  confidence_level: 'medium', // Set to 'high' once all entries are verified
  source_url: 'https://educationendowmentfoundation.org.uk',
};

/**
 * EEF Entry Content Structure
 * 
 * Each rule.content contains structured JSON with:
 * - theme: e.g. "Feedback", "Early Language"
 * - summary_plain_english: 2-4 sentences, non-technical
 * - strength_of_evidence: "High", "Moderate", "Limited"
 * - cost_implication: "Low", "Moderate", "High"
 * - implementation_considerations: short bullet list
 * - relevant_when: plain-English triggers
 * - limitations_or_caveats: e.g. "requires sustained CPD"
 */

export const EEF_RULES: Rule[] = [
  {
    id: 'eef-feedback',
    pack_id: 'eef-research-v1',
    topic: 'feedback',
    applies_when_text: 'action involves feedback OR improving feedback practices OR assessment feedback',
    content: JSON.stringify({
      theme: 'Feedback',
      summary_plain_english: 'EEF evidence suggests that effective feedback can have a positive impact on pupil outcomes when it is specific, timely, and actionable. Feedback that focuses on the task rather than the pupil, and provides clear guidance on how to improve, is generally more effective. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'High',
      cost_implication: 'Low',
      implementation_considerations: [
        'Ensure feedback is specific and linked to learning objectives',
        'Provide feedback in a timely manner',
        'Focus on task rather than pupil characteristics',
        'Train staff in effective feedback techniques',
      ],
      relevant_when: 'When seeking to improve teaching effectiveness, assessment practices, or pupil progress',
      limitations_or_caveats: 'Effectiveness depends on quality of implementation and may require sustained CPD',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-metacognition',
    pack_id: 'eef-research-v1',
    topic: 'metacognition_self_regulation',
    applies_when_text: 'action involves metacognition OR self-regulation OR teaching pupils how to learn',
    content: JSON.stringify({
      theme: 'Metacognition & Self-regulation',
      summary_plain_english: 'EEF evidence suggests that teaching pupils strategies to plan, monitor, and evaluate their own learning can have a significant positive impact. This approach helps pupils become more independent learners by developing their awareness of how they learn. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'High',
      cost_implication: 'Low',
      implementation_considerations: [
        'Explicitly teach metacognitive strategies',
        'Model thinking processes to pupils',
        'Provide opportunities for pupils to practice and reflect',
        'Integrate metacognitive approaches across the curriculum',
      ],
      relevant_when: 'When seeking to develop independent learning, improve pupil outcomes, or support pupils with learning difficulties',
      limitations_or_caveats: 'Requires careful planning and may take time to embed effectively',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-early-language',
    pack_id: 'eef-research-v1',
    topic: 'early_language',
    applies_when_text: 'action involves early language OR language development OR early years communication',
    content: JSON.stringify({
      theme: 'Early Language Interventions',
      summary_plain_english: 'EEF evidence suggests that early language interventions can have a positive impact on children\'s language development, particularly for those from disadvantaged backgrounds. Approaches that involve structured activities, adult-child interaction, and vocabulary development show promise. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Moderate',
      implementation_considerations: [
        'Focus on vocabulary development and language-rich environments',
        'Provide structured opportunities for adult-child interaction',
        'Consider targeted interventions for children with language delays',
        'Train staff in language development strategies',
      ],
      relevant_when: 'When working with early years, supporting language development, or addressing communication needs',
      limitations_or_caveats: 'Effectiveness may vary depending on intensity and quality of implementation',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/early-years-toolkit',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-reading-comprehension',
    pack_id: 'eef-research-v1',
    topic: 'reading_comprehension',
    applies_when_text: 'action involves reading comprehension OR improving reading OR reading strategies',
    content: JSON.stringify({
      theme: 'Reading Comprehension',
      summary_plain_english: 'EEF evidence suggests that explicit teaching of reading comprehension strategies can improve pupils\' understanding of texts. Approaches that teach pupils to monitor their understanding, ask questions, and make connections show positive effects. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Low',
      implementation_considerations: [
        'Teach comprehension strategies explicitly',
        'Model reading comprehension processes',
        'Provide opportunities for guided and independent practice',
        'Use a range of texts appropriate to pupils\' reading levels',
      ],
      relevant_when: 'When seeking to improve reading outcomes, support struggling readers, or develop reading across the curriculum',
      limitations_or_caveats: 'Effectiveness depends on quality of teaching and may require sustained implementation',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-phonics',
    pack_id: 'eef-research-v1',
    topic: 'phonics',
    applies_when_text: 'action involves phonics OR systematic synthetic phonics OR early reading',
    content: JSON.stringify({
      theme: 'Phonics',
      summary_plain_english: 'EEF evidence suggests that systematic synthetic phonics approaches can be effective in teaching early reading, particularly for pupils in Reception and Key Stage 1. Structured, sequential approaches that teach letter-sound correspondences show positive effects. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'High',
      cost_implication: 'Low',
      implementation_considerations: [
        'Use systematic, structured phonics programmes',
        'Ensure consistency across teaching',
        'Provide regular practice and reinforcement',
        'Monitor pupil progress and provide additional support where needed',
      ],
      relevant_when: 'When teaching early reading, supporting pupils with reading difficulties, or implementing phonics programmes',
      limitations_or_caveats: 'Should be part of a broader reading curriculum that includes comprehension and enjoyment of texts',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-small-group-tuition',
    pack_id: 'eef-research-v1',
    topic: 'small_group_tuition',
    applies_when_text: 'action involves small group tuition OR targeted intervention OR additional support',
    content: JSON.stringify({
      theme: 'Small Group Tuition',
      summary_plain_english: 'EEF evidence suggests that small group tuition can be effective when delivered by trained staff, focused on specific learning needs, and integrated with classroom teaching. Groups of 2-5 pupils typically show positive effects. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Moderate',
      implementation_considerations: [
        'Keep groups small (2-5 pupils)',
        'Ensure tutors are trained and supported',
        'Focus on specific learning needs',
        'Integrate with classroom teaching',
        'Monitor progress regularly',
      ],
      relevant_when: 'When providing targeted support, addressing learning gaps, or supporting pupils who need additional help',
      limitations_or_caveats: 'Effectiveness depends on quality of delivery and may require additional staffing resources',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-send-targeted',
    pack_id: 'eef-research-v1',
    topic: 'send_targeted_interventions',
    applies_when_text: 'action involves SEND OR special educational needs OR targeted interventions for SEND',
    content: JSON.stringify({
      theme: 'SEND – Targeted Interventions',
      summary_plain_english: 'EEF evidence suggests that targeted interventions for pupils with special educational needs can be effective when they are well-designed, delivered by trained staff, and tailored to individual needs. Approaches that combine academic support with social and emotional support show promise. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Moderate',
      implementation_considerations: [
        'Tailor interventions to individual pupil needs',
        'Ensure staff are trained and supported',
        'Combine academic and social-emotional support where appropriate',
        'Monitor progress and adjust interventions as needed',
        'Work closely with families and external professionals',
      ],
      relevant_when: 'When supporting pupils with SEND, addressing specific learning needs, or providing targeted interventions',
      limitations_or_caveats: 'Effectiveness varies depending on individual needs and quality of implementation',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/send',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-behaviour',
    pack_id: 'eef-research-v1',
    topic: 'behaviour_interventions',
    applies_when_text: 'action involves behaviour OR behaviour management OR improving behaviour',
    content: JSON.stringify({
      theme: 'Behaviour Interventions',
      summary_plain_english: 'EEF evidence suggests that approaches to improving behaviour are most effective when they are consistently applied, involve clear expectations, and focus on positive reinforcement. Whole-school approaches that combine clear rules, rewards, and consequences show positive effects. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Low',
      implementation_considerations: [
        'Establish clear, consistent expectations',
        'Use positive reinforcement alongside consequences',
        'Ensure whole-school consistency',
        'Provide training and support for staff',
        'Monitor and review behaviour policies regularly',
      ],
      relevant_when: 'When seeking to improve behaviour, establish positive school culture, or support pupils with behavioural needs',
      limitations_or_caveats: 'Effectiveness depends on consistency and may require sustained implementation',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-professional-development',
    pack_id: 'eef-research-v1',
    topic: 'professional_development',
    applies_when_text: 'action involves CPD OR professional development OR staff training',
    content: JSON.stringify({
      theme: 'Professional Development',
      summary_plain_english: 'EEF evidence suggests that effective professional development is sustained, focused on specific teaching practices, and includes opportunities for practice and feedback. Approaches that combine training with coaching and follow-up support show positive effects on teaching quality. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Moderate',
      implementation_considerations: [
        'Focus on specific teaching practices',
        'Provide sustained support over time',
        'Include opportunities for practice and feedback',
        'Use coaching and mentoring where appropriate',
        'Evaluate impact on teaching and pupil outcomes',
      ],
      relevant_when: 'When planning CPD, improving teaching quality, or supporting staff development',
      limitations_or_caveats: 'Effectiveness depends on quality of delivery and may require significant time investment',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/professional-development',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
  {
    id: 'eef-assessment-for-learning',
    pack_id: 'eef-research-v1',
    topic: 'assessment_for_learning',
    applies_when_text: 'action involves assessment for learning OR formative assessment OR using assessment to improve teaching',
    content: JSON.stringify({
      theme: 'Assessment for Learning',
      summary_plain_english: 'EEF evidence suggests that assessment for learning approaches can improve pupil outcomes when they are used to inform teaching and provide feedback to pupils. Approaches that involve regular, low-stakes assessment and clear feedback show positive effects. This summary reflects EEF guidance and should be interpreted in the context of the school.',
      strength_of_evidence: 'Moderate',
      cost_implication: 'Low',
      implementation_considerations: [
        'Use assessment to inform teaching decisions',
        'Provide clear, actionable feedback to pupils',
        'Involve pupils in assessment processes',
        'Use a range of assessment methods',
        'Ensure assessment is low-stakes and supportive',
      ],
      relevant_when: 'When seeking to improve teaching, provide feedback to pupils, or use assessment to support learning',
      limitations_or_caveats: 'Effectiveness depends on quality of implementation and may require training for staff',
    }),
    citations: [
      {
        source: 'Education Endowment Foundation',
        section: 'TBD - verify EEF publication title and section',
        url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit',
        authority_level: 'guidance',
      },
    ],
    authority_level: 'guidance',
  },
];

/**
 * Get EEF Knowledge Pack
 */
export function getEEFPack(): KnowledgePack {
  return EEF_PACK;
}

/**
 * Get EEF Rules
 */
export function getEEFRules(): Rule[] {
  return EEF_RULES;
}

