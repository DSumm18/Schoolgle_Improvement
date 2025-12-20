// Ed Cache API - Pre-loaded responses for common questions

import { NextRequest, NextResponse } from 'next/server';

// Cached responses for each tool
const CACHED_RESPONSES: Record<string, Record<string, string>> = {
  sims: {
    'How do I add a new pupil?': 'Go to Focus > Pupil > Pupil Details, click New, fill in the required fields (surname, forename, DOB, gender), then click Save.',
    'How do I run an attendance report?': 'Go to Reports > Attendance Reports, select the report type, set your date range and year groups, then click Run Report. You can export to Excel for further analysis.',
    'What is the keyboard shortcut for quick search?': 'Use Ctrl+Q to open quick search. You can search for pupils, staff, or any record by name.',
    'How do I record a behaviour incident?': 'Go to Focus > Behaviour Management, click New Incident, select the pupil(s), choose incident type and severity, add notes and actions taken, then Save.',
  },
  arbor: {
    'How do I mark attendance?': 'Go to Students > Attendance > Mark Attendance, select your class from the dropdown, click each student to mark present or use quick mark buttons, then Save.',
    'How do I send a message to parents?': 'Go to Communications > Messages > New Message, select recipients (parents), choose method (email, SMS, or both), write your message and click Send.',
    'How do I log a safeguarding concern?': 'Find the student profile, click the Safeguarding tab, click New Concern, complete all required fields, and Submit for DSL review.',
    'How do I use the search?': 'Use the global search bar at the top of the page. You can search for students, staff, or navigate to any page quickly.',
  },
  cpoms: {
    'How do I log a new incident?': 'Click Add Incident (+), search for and select the student, choose the incident category, write a detailed factual account, tag for DSL attention if urgent, then Submit.',
    'How do I add an action?': 'Open the relevant incident, click Add Action, select the action type, assign to the appropriate staff member, set a due date, then Save.',
    'How do I review alerts?': 'Go to your Dashboard, check the Alerts panel, click each alert to review, add actions or notes as needed, then mark as reviewed when complete.',
    'What should I include in an incident report?': 'Use objective, factual language. Record what the child said in their own words using quotation marks. Include date, time, location, and any witnesses.',
  },
  'google-classroom': {
    'How do I create an assignment?': 'Open your class, click the Classwork tab, click Create > Assignment, add title, instructions, and resources, set due date and points, then click Assign.',
    'How do I grade student work?': 'Open the assignment, click on a student submission, review their work, add comments if needed, enter the grade, then click Return to return it to the student.',
    'How do I schedule a post?': 'When creating any post, click the dropdown arrow next to the post button and select "Schedule". Choose your date and time, then click Schedule.',
    'How do I organise classwork?': 'Use Topics to organise classwork by unit, week, or theme. Click Create > Topic, name it, then drag assignments into the topic.',
  },
  canva: {
    'How do I create a poster?': 'Click Create a Design, search for "Poster" or choose a specific size, browse templates or start blank, add text, images, and elements, then download or share when ready.',
    'How do I set up my school brand?': 'Go to Brand Kit in the left sidebar, add your school logo, set primary and secondary colours, and choose your fonts. These will be available in all designs.',
    'How do I share with students?': 'Click Share, then "Share a link to use as a template". Students will get their own copy to edit without changing your original.',
    'How do I download my design?': 'Click Share > Download, choose the file type (PDF for print, PNG for digital), select the quality, and click Download.',
  },
  'every-budget': {
    'How do I create a new scenario?': 'Go to Scenarios in the main menu, click Create New Scenario, choose a base (blank or copy existing), name it clearly, and set the financial years to include.',
    'How do I add staffing costs?': 'Open your scenario, go to the Staffing section, click Add Staff or Import from MIS, enter salary details, on-costs, and FTE, then review the total staff cost summary.',
    'How do I run a CFR report?': 'Go to Reports > Statutory Returns, select Consistent Financial Reporting (CFR), choose the relevant year, review mappings to CFR codes, then Export for submission.',
  },
  parentpay: {
    'How do I set up a payment item?': 'Go to Finance > Payment Items, click Add New Item, set the name, price, and description, choose which year groups can see it, set open/close dates, then Publish.',
    'How do I check who has paid?': 'Go to Reports > Payment Reports, select the payment item, view who has paid and who hasn\'t. You can export this for your records.',
    'How do I send payment reminders?': 'From the payment report, you can select unpaid parents and use the messaging feature to send reminders directly through ParentPay.',
  },
};

/**
 * GET /api/ed/cache/[toolId]
 * Get cached responses for a specific tool
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  
  const cached = CACHED_RESPONSES[toolId] || {};
  
  return NextResponse.json(cached);
}

