"""
Auto-generates a structured .docx RnD post-event report.
Uses report_template.docx as a template to inherit header (dual logos) and footer (Page X of Y).
Called after RnD report submission — saves file to /events/{event_id}/rnd_report/generated_rnd_report.docx
"""
import os
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from datetime import datetime

from app.models.event import Event
from app.models.event_rnd_report import EventRndReport
from app.config import settings

# Path to the template docx that has the correct header/footer
TEMPLATE_DOCX = os.path.join(os.path.dirname(__file__), "..", "templates", "report_template.docx")


def _add_bold_label_value(doc: Document, label: str, value: str):
    """Add a paragraph with bold label followed by normal value."""
    p = doc.add_paragraph()
    run_label = p.add_run(label)
    run_label.bold = True
    p.add_run(value or "N/A")
    return p


def _add_section_heading(doc: Document, text: str):
    """Add a styled section heading."""
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 2"]
    run = p.add_run(text)
    return p


def _add_subsection_heading(doc: Document, text: str):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 3"]
    p.add_run(text)
    return p


def _table_row(table, label: str, value: str):
    row = table.add_row()
    row.cells[0].text = label
    row.cells[1].text = str(value) if value is not None else "N/A"
    row.cells[0].paragraphs[0].runs[0].bold = True


def generate_rnd_report(event: Event, report: EventRndReport) -> str:
    """
    Generate a .docx RnD report for the event using the institutional template
    (which carries the dual-logo header and page-number footer).
    Returns the path where the file was saved.
    """
    # Determine template path — fall back gracefully if not deployed yet
    template_path = TEMPLATE_DOCX
    if not os.path.exists(template_path):
        base = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(base, "..", "templates", "report_template.docx"),
            os.path.join(base, "report_template.docx"),
            os.path.join(settings.STORAGE_ROOT, "report_template.docx"),
        ]
        for c in candidates:
            if os.path.exists(c):
                template_path = c
                break
        else:
            template_path = None

    # Open template (inherits header/footer) or blank document
    if template_path:
        doc = Document(template_path)
        # Clear all body content from template, keep header/footer
        body = doc.element.body
        for child in list(body):
            tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if tag not in ("sectPr",):
                body.remove(child)
    else:
        doc = Document()

    # ── PAGE TITLE ──────────────────────────────────────────────────────────
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("RnD Report on")
    run.bold = True
    run.font.size = Pt(14)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    event_title_text = f'"{event.title}"'
    run2 = subtitle.add_run(event_title_text)
    run2.bold = True
    run2.font.size = Pt(13)

    doc.add_paragraph()  # spacer

    # ── SECTION 1: BASIC EVENT DETAILS ──────────────────────────────────────
    _add_section_heading(doc, "1. Event Details")

    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"

    _table_row(table, "Event Title", event.title)
    _table_row(table, "Program Type", report.program_type or "N/A")
    _table_row(table, "Department", event.school_department or "N/A")
    _table_row(table, "Organizing Club", event.club.name if event.club else "Non-Club Event")
    _table_row(table, "Venue", event.venue_custom or (event.venue.name if event.venue else "N/A"))
    _table_row(table, "Start Date", event.start_datetime.strftime("%d %B %Y"))
    _table_row(table, "End Date", event.end_datetime.strftime("%d %B %Y"))
    _table_row(
        table, "Time",
        f"{event.start_datetime.strftime('%I:%M %p')} – {event.end_datetime.strftime('%I:%M %p')}"
    )

    # Duration in hours
    duration_hrs = round(
        (event.end_datetime - event.start_datetime).total_seconds() / 3600, 2
    )
    _table_row(table, "Duration (hrs)", str(duration_hrs))
    _table_row(table, "Mode of Delivery", (report.mode_of_delivery or "N/A").title())

    doc.add_paragraph()

    # ── SECTION 2: GUEST SPEAKERS ────────────────────────────────────────────
    speakers = report.guest_speakers or []
    if speakers:
        _add_section_heading(doc, "2. Guest Speaker(s)")
        for i, spk in enumerate(speakers, 1):
            if len(speakers) > 1:
                _add_subsection_heading(doc, f"Speaker {i}")
            spk_table = doc.add_table(rows=0, cols=2)
            spk_table.style = "Table Grid"
            _table_row(spk_table, "Name", spk.get("name", ""))
            _table_row(spk_table, "Designation", spk.get("designation", ""))
            _table_row(spk_table, "Organization", spk.get("organization", ""))
            _table_row(spk_table, "Area of Expertise", spk.get("expertise", ""))
            doc.add_paragraph()
    else:
        _add_section_heading(doc, "2. Guest Speaker(s)")
        doc.add_paragraph("N/A")
        doc.add_paragraph()

    # ── SECTION 3: SOCIAL MEDIA LINKS ────────────────────────────────────────
    _add_section_heading(doc, "3. Social Media Links")

    def add_social_block(heading, links_dict):
        _add_subsection_heading(doc, heading)
        if links_dict:
            for platform in ("facebook", "instagram", "x", "linkedin"):
                val = links_dict.get(platform, "")
                if val:
                    _add_bold_label_value(doc, f"{platform.title()}: ", val)
        else:
            doc.add_paragraph("N/A")

    add_social_block("E-Pamphlet Links", report.social_pamphlet)
    add_social_block("Video Links", report.social_video)
    doc.add_paragraph()

    # ── SECTION 4: OBJECTIVE & LEARNING ──────────────────────────────────────
    _add_section_heading(doc, "4. Objective & Learning Outcomes")
    _add_subsection_heading(doc, "Objective of the Activity (100 chars)")
    doc.add_paragraph(report.objective or "N/A")
    _add_subsection_heading(doc, "Benefit in Terms of Learning / Skills / Knowledge (150 chars)")
    doc.add_paragraph(report.learning_benefit or "N/A")
    doc.add_paragraph()

    # ── SECTION 5: COORDINATORS ───────────────────────────────────────────────
    _add_section_heading(doc, "5. Coordinators")

    coord_table = doc.add_table(rows=0, cols=2)
    coord_table.style = "Table Grid"
    faculty = report.faculty_coordinators or []
    students = report.student_coordinators or []
    max_rows = max(len(faculty), len(students), 1)

    # Header row
    hdr = coord_table.add_row()
    hdr.cells[0].text = "Faculty Coordinators"
    hdr.cells[1].text = "Student Coordinators"
    for cell in hdr.cells:
        cell.paragraphs[0].runs[0].bold = True

    for i in range(max_rows):
        row = coord_table.add_row()
        row.cells[0].text = faculty[i] if i < len(faculty) else ""
        row.cells[1].text = students[i] if i < len(students) else ""

    doc.add_paragraph()

    # ── SECTION 6: PARTICIPANTS & EXPENDITURE ────────────────────────────────
    _add_section_heading(doc, "6. Participants & Expenditure")
    p_table = doc.add_table(rows=0, cols=2)
    p_table.style = "Table Grid"
    _table_row(p_table, "Number of Student Participants", str(report.student_count or 0))
    _table_row(p_table, "Number of Faculty Participants", str(report.faculty_count or 0))
    _table_row(p_table, "Number of External Participants", str(report.external_count or 0))
    _table_row(p_table, "Total Participants", str(report.participant_count))
    _table_row(p_table, "Estimated Budget", f"Rs. {event.budget:,.2f}" if event.budget else "N/A")
    _table_row(p_table, "Actual Expenditure", f"Rs. {report.actual_budget:,.2f}")
    doc.add_paragraph()

    # ── SECTION 7: SPEAKER BACKGROUND ────────────────────────────────────────
    _add_section_heading(doc, "7. Background of the Speaker(s)")
    doc.add_paragraph(report.speaker_background or "N/A")
    doc.add_paragraph()

    # ── SECTION 8: SESSION REPORT & KEY OUTCOMES ─────────────────────────────
    _add_section_heading(doc, "8. Report on the Session")
    _add_subsection_heading(doc, "Session Summary")
    doc.add_paragraph(report.event_summary or "N/A")

    _add_subsection_heading(doc, "Detailed Session Report")
    doc.add_paragraph(report.session_report or "N/A")

    _add_subsection_heading(doc, "Key Outcomes")
    key_outcomes = report.key_outcomes or []
    if key_outcomes:
        for outcome in key_outcomes:
            p = doc.add_paragraph(style="List Bullet")
            p.add_run(outcome)
    else:
        doc.add_paragraph("N/A")
    doc.add_paragraph()

    # Optional legacy fields
    if report.issues:
        _add_subsection_heading(doc, "Issues Faced")
        doc.add_paragraph(report.issues)

    if report.feedback:
        _add_subsection_heading(doc, "Feedback and Suggestions")
        doc.add_paragraph(report.feedback)

    doc.add_paragraph()

    # ── SECTION 9: CONCLUSION ─────────────────────────────────────────────────
    _add_section_heading(doc, "9. Conclusion")
    doc.add_paragraph(report.conclusion or "N/A")
    doc.add_paragraph()

    # ── SECTION 10: ATTACHMENTS & PHOTOS ─────────────────────────────────────
    _add_section_heading(doc, "10. Attachments")

    if report.attendance_doc_path:
        _add_bold_label_value(doc, "Attendance Document: ", os.path.basename(report.attendance_doc_path))

    # Flier (1 compulsory)
    if report.flier_path and os.path.exists(report.flier_path):
        _add_subsection_heading(doc, "Event Flier")
        try:
            doc.add_picture(report.flier_path, width=Inches(4.0))
            fp = doc.add_paragraph(os.path.basename(report.flier_path))
            fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        except Exception:
            doc.add_paragraph(f"Flier: {os.path.basename(report.flier_path)}")

    # Event photos (4–8, embed up to 8)
    photo_dir = os.path.join(settings.STORAGE_ROOT, "events", str(event.id), "rnd_report", "photos")
    if os.path.exists(photo_dir):
        photos = sorted([
            f for f in os.listdir(photo_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        ])
        if photos:
            _add_subsection_heading(doc, "Event Photos")
            for photo in photos[:8]:
                photo_path = os.path.join(photo_dir, photo)
                try:
                    doc.add_picture(photo_path, width=Inches(3.0))
                    pp = doc.add_paragraph(photo)
                    pp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                except Exception:
                    doc.add_paragraph(f"Photo: {photo}")

    # ── FOOTER NOTE ────────────────────────────────────────────────────────────
    doc.add_paragraph()
    footer_note = doc.add_paragraph(
        f"RnD Report generated on {datetime.now().strftime('%d %B %Y at %I:%M %p')}"
    )
    footer_note.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # ── SAVE ───────────────────────────────────────────────────────────────────
    report_dir = os.path.join(settings.STORAGE_ROOT, "events", str(event.id), "rnd_report")
    os.makedirs(report_dir, exist_ok=True)
    output_path = os.path.join(report_dir, "generated_rnd_report.docx")
    doc.save(output_path)

    return output_path
