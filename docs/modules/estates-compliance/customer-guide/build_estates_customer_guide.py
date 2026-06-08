from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parent
SCREENSHOTS = ROOT / "screenshots"
OUTPUT = ROOT / "Schoolgle Estates Management Customer Guide.docx"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def style_run(run, bold=False, color=None, size=None):
    run.bold = bold
    if color:
      run.font.color.rgb = RGBColor.from_string(color)
    if size:
      run.font.size = Pt(size)


def add_heading(doc, text, level=1):
    paragraph = doc.add_heading(text, level=level)
    for run in paragraph.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor.from_string("2E74B5" if level < 3 else "1F4D78")
    return paragraph


def add_bullets(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Bullet")
        paragraph.paragraph_format.left_indent = Inches(0.375)
        paragraph.paragraph_format.first_line_indent = Inches(-0.188)
        paragraph.paragraph_format.space_after = Pt(4)
        paragraph.paragraph_format.line_spacing = 1.25
        paragraph.add_run(item)


def add_steps(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Number")
        paragraph.paragraph_format.left_indent = Inches(0.375)
        paragraph.paragraph_format.first_line_indent = Inches(-0.188)
        paragraph.paragraph_format.space_after = Pt(4)
        paragraph.paragraph_format.line_spacing = 1.25
        paragraph.add_run(item)


def add_callout(doc, title, body, fill="E8EEF5"):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    table.allow_autofit = False
    table.columns[0].width = Inches(6.5)
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(4)
    title_run = p.add_run(title)
    style_run(title_run, bold=True, color="0B2545")
    p.add_run(f"\n{body}")
    doc.add_paragraph()


def add_image(doc, filename, caption):
    path = SCREENSHOTS / filename
    if path.exists():
        doc.add_picture(str(path), width=Inches(6.5))
        caption_p = doc.add_paragraph(caption)
        caption_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        caption_p.runs[0].font.size = Pt(9)
        caption_p.runs[0].font.color.rgb = RGBColor.from_string("555555")


def build():
    doc = Document()
    section = doc.sections[0]
    section.orientation = WD_ORIENT.PORTRAIT
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    styles = doc.styles
    styles["Normal"].font.name = "Calibri"
    styles["Normal"].font.size = Pt(11)
    styles["Normal"].paragraph_format.space_after = Pt(6)
    styles["Normal"].paragraph_format.line_spacing = 1.25

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("Schoolgle Estates Management Customer Guide")
    style_run(run, bold=True, color="0B2545", size=22)
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run("Assets · Contractors · Compliance Checks · Tickets · Evidence").italic = True

    add_callout(
        doc,
        "Purpose",
        "This guide explains how a school uses Estates Management to keep assets, contractors, inspections, tickets, tasks, warranties and evidence connected in one audit trail.",
    )

    add_heading(doc, "1. The Full Circle", 1)
    doc.add_paragraph(
        "The Estates Management app is designed around one joined-up operational loop: add the asset, link it to the contractor and compliance check, complete the inspection, raise tickets or tasks when something fails, then keep evidence against the asset and check history."
    )
    add_bullets(
        doc,
        [
            "Assets are the real items on site: outlets, showers, extinguishers, boilers, emergency lights, playground items and similar equipment.",
            "Contractors are suppliers, maintainers, inspectors, warranty providers, or repair companies.",
            "Compliance checks are statutory, good-practice, or school-created inspections.",
            "Tickets and tasks capture follow-up work when an inspection finds an issue.",
            "Evidence records photos, certificates, completion notes, invoices, receipts and warranty documents.",
        ],
    )
    add_image(doc, "01-compliance-check-full-circle.png", "Compliance check with linked assets, tickets, tasks and completion history.")

    add_heading(doc, "2. Add an Asset", 1)
    add_steps(
        doc,
        [
            "Open Estates → Assets or Asset Tags.",
            "Select Add Asset.",
            "Enter the asset name, type, code, location and status.",
            "Add purchase value, invoice, purchase order, warranty and expected life details.",
            "Select the supplier and the maintainer/warranty contractor where known.",
            "Link the relevant compliance domains and checks, then save.",
            "Print the QR code and attach it to the item if required.",
        ],
    )
    add_image(doc, "03-add-asset-form.png", "Add Asset form showing purchase, warranty and contractor fields.")
    add_image(doc, "02-linked-asset-detail.png", "Asset detail showing supplier/maintainer links and related activity.")

    add_heading(doc, "3. Add a Contractor", 1)
    add_steps(
        doc,
        [
            "Open Estates → Contractors.",
            "Select Add Contractor.",
            "Enter the company, contact details, services, accreditation notes and status.",
            "Mark the contractor as preferred if appropriate.",
            "Save the contractor, then link it to assets, tasks, tickets or contracts.",
        ],
    )
    add_image(doc, "04-add-contractor-form.png", "Add Contractor form for supplier, maintainer and inspector records.")

    add_heading(doc, "4. Link Assets and Contractors to Checks", 1)
    doc.add_paragraph(
        "Use the asset record to decide which compliance checks apply to that item. For example, a shower can be linked to weekly outlet flushing, while an extinguisher can be linked to fire safety checks. Once linked, the check page shows the asset under Assets covered."
    )
    add_callout(
        doc,
        "Good practice",
        "Do not delete old assets when they are replaced if their history is needed. Retire or dispose of the old asset, add the new one, then print a new QR label for the replacement.",
        fill="F4F6F9",
    )

    add_heading(doc, "5. Complete a Compliance Check", 1)
    add_steps(
        doc,
        [
            "Open Estates → Compliance Checks.",
            "Choose the domain, such as Legionella Control or Fire Safety.",
            "Open the check.",
            "Review frequency, statutory/advisory status, next due date and linked assets.",
            "Expand Record completion.",
            "Enter status, inspection date, notes and evidence.",
            "Save the completion and review the Completion history section.",
        ],
    )

    add_heading(doc, "6. Raise a Ticket or Task from a Failed Check", 1)
    add_steps(
        doc,
        [
            "Open the compliance check.",
            "Select Raise ticket for faults, hazards, missing evidence or non-compliance.",
            "Select Add task for planned follow-up work.",
            "Choose the affected asset where relevant.",
            "Attach photos or documents.",
            "Assign staff or a contractor and save.",
        ],
    )
    doc.add_paragraph(
        "The ticket or task remains linked to the compliance check, the asset, the contractor and the helpdesk/task list."
    )
    add_image(doc, "05-raise-ticket-from-check.png", "New ticket opened from a compliance check with the check context preserved.")

    add_heading(doc, "7. Create a School Check", 1)
    add_steps(
        doc,
        [
            "Open the relevant domain, such as Fire Safety.",
            "Select Add Check.",
            "Start from a template or from scratch.",
            "Add name, description, evidence requirements, checklist items and frequency.",
            "Choose School check / non-statutory for local routines.",
            "Choose Statutory / regulated only where a law, regulation, trust policy or approved Schoolgle strategy applies.",
            "Add the statutory reference if the check is statutory, then save.",
        ],
    )
    add_image(doc, "06-custom-check-wizard.png", "Custom check wizard with statutory/non-statutory classification.")
    add_image(doc, "07-fire-domain-custom-check.png", "Fire Safety domain showing a school-created check.")
    add_callout(
        doc,
        "Statutory frequency rule",
        "Statutory frequencies are not school preferences. They should come from the regulation, approved strategy, or Schoolgle-managed statutory check library. School-created statutory checks are frequency-locked once saved.",
        fill="FFF2CC",
    )

    add_heading(doc, "8. Customer Testing Checklist", 1)
    add_bullets(
        doc,
        [
            "Add an asset with purchase, warranty and contractor information.",
            "Add a contractor and mark whether it is preferred.",
            "Link an asset to a compliance check.",
            "Complete a compliance check and review completion history.",
            "Raise a ticket from a failed check and confirm it appears on the check page.",
            "Raise a task from a check and assign it to a staff member or contractor.",
            "Replace an asset by retiring the old record and adding a new QR-tagged asset.",
            "Create a non-statutory school check and confirm it appears in the relevant domain.",
        ],
    )

    footer = section.footer.paragraphs[0]
    footer.text = "Schoolgle Estates Management Customer Guide"
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.runs[0].font.size = Pt(9)
    footer.runs[0].font.color.rgb = RGBColor.from_string("555555")

    doc.save(OUTPUT)


if __name__ == "__main__":
    build()
