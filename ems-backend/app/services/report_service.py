"""
Auto-generates a structured .docx post-event report.
Called after report submission — saves file to /events/{event_id}/report/generated_report.docx
"""
import os
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from datetime import datetime

from app.models.event import Event
from app.models.event_report import EventReport
from app.config import settings


def generate_event_report(event: Event, report: EventReport) -> str:
    """
    Generate a .docx report for the event.
    Returns the path where the file was saved.
    """
    doc = Document()

    # === HEADER / TITLE ===
    title_para = doc.add_heading(settings.COLLEGE_NAME, level=0)
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    subtitle = doc.add_heading("POST-EVENT REPORT", level=1)
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph()  # spacer

    # === PART 1: EVENT DETAILS ===
    doc.add_heading("1. Event Details", level=2)
    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"

    def add_row(label, value):
        row = table.add_row()
        row.cells[0].text = label
        row.cells[1].text = str(value) if value is not None else "N/A"
        row.cells[0].paragraphs[0].runs[0].bold = True

    add_row("Event Name", event.title)
    add_row("Event Type", event.event_type.title())
    add_row("Department", event.school_department)
    add_row("Organizing Club", event.club.name if event.club else "Non-Club Event")
    add_row("Event Incharge", event.event_incharge_name)
    add_row("Contact", event.event_incharge_contact)
    add_row("Date", event.start_datetime.strftime("%d %B %Y"))
    add_row(
        "Time",
        f"{event.start_datetime.strftime('%I:%M %p')} – {event.end_datetime.strftime('%I:%M %p')}",
    )
    add_row("Venue", event.venue_custom or (event.venue.name if event.venue else "N/A"))
    add_row("Target Audience", event.target_audience.replace("_", " ").title())
    add_row("Estimated Budget", f"Rs. {event.budget:,.2f}")
    add_row("Actual Budget Spent", f"Rs. {report.actual_budget:,.2f}")

    if event.is_sponsored and event.sponsors:
        sponsors = ", ".join(s.name for s in event.sponsors)
        add_row("Sponsors", sponsors)

    doc.add_paragraph()

    # === PART 2: REPORT INPUTS ===
    doc.add_heading("2. Event Report", level=2)

    doc.add_heading("2.1 Event Summary", level=3)
    doc.add_paragraph(report.event_summary)

    doc.add_heading("2.2 Participant Count", level=3)
    doc.add_paragraph(f"Total Participants: {report.participant_count}")

    doc.add_heading("2.3 Outcomes and Takeaways", level=3)
    doc.add_paragraph(report.outcomes)

    if report.issues:
        doc.add_heading("2.4 Issues Faced", level=3)
        doc.add_paragraph(report.issues)

    if report.feedback:
        doc.add_heading("2.5 Feedback and Suggestions", level=3)
        doc.add_paragraph(report.feedback)

    doc.add_paragraph()

    # === PART 3: ATTACHMENTS ===
    doc.add_heading("3. Attachments", level=2)

    if report.attendance_doc_path:
        doc.add_paragraph(f"Attendance Document: {os.path.basename(report.attendance_doc_path)}")

    # Event photos (embed up to 10)
    photo_dir = os.path.join(settings.STORAGE_ROOT, "events", str(event.id), "report", "photos")
    if os.path.exists(photo_dir):
        photos = [
            f for f in os.listdir(photo_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        ]
        if photos:
            doc.add_heading("Event Photos", level=3)
            for photo in photos[:10]:
                photo_path = os.path.join(photo_dir, photo)
                try:
                    doc.add_picture(photo_path, width=Inches(3.0))
                    p = doc.add_paragraph(photo)
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                except Exception:
                    doc.add_paragraph(f"Photo: {photo}")

    # === FOOTER ===
    doc.add_paragraph()
    footer_para = doc.add_paragraph(
        f"Report generated on {datetime.now().strftime('%d %B %Y at %I:%M %p')}"
    )
    footer_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # === SAVE ===
    report_dir = os.path.join(settings.STORAGE_ROOT, "events", str(event.id), "report")
    os.makedirs(report_dir, exist_ok=True)
    output_path = os.path.join(report_dir, "generated_report.docx")
    doc.save(output_path)

    return output_path
