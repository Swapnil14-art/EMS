"""
Email trigger service — called from API routes.
Each function builds the right email content and dispatches Celery tasks.
"""
from typing import List, Any
from app.tasks.email_tasks import send_email, send_bulk_email
from app.config import settings

def _build_email_html(content_html: str) -> str:
    """Wraps email content in a professional, responsive HTML template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                background-color: #f7fafc;
                margin: 0;
                padding: 0;
                color: #2d3748;
                -webkit-font-smoothing: antialiased;
            }}
            .email-wrapper {{
                width: 100%;
                background-color: #f7fafc;
                padding: 40px 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
            }}
            .header {{
                background-color: #1a365d;
                background-image: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%);
                color: #ffffff;
                padding: 35px 40px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }}
            .content {{
                padding: 40px;
                line-height: 1.6;
                font-size: 16px;
            }}
            .content h2 {{
                color: #2b6cb0;
                margin-top: 0;
                font-size: 22px;
                border-bottom: 2px solid #edf2f7;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 24px 40px;
                text-align: center;
                font-size: 13px;
                color: #718096;
                border-top: 1px solid #e2e8f0;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 25px;
                margin-bottom: 25px;
                background-color: #f8fafc;
                border-radius: 6px;
                overflow: hidden;
            }}
            table td {{
                padding: 14px 18px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 15px;
            }}
            table tr:last-child td {{
                border-bottom: none;
            }}
            table tr td:first-child {{
                font-weight: 600;
                color: #4a5568;
                width: 35%;
                background-color: #edf2f7;
            }}
            .btn {{
                display: inline-block;
                padding: 12px 28px;
                background-color: #3182ce;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin-top: 25px;
                text-align: center;
                transition: background-color 0.2s;
            }}
            .btn:hover {{
                background-color: #2b6cb0;
            }}
            .alert {{
                background-color: #ebf8ff;
                border-left: 4px solid #3182ce;
                padding: 16px 20px;
                margin: 25px 0;
                border-radius: 0 6px 6px 0;
            }}
            .alert-warning {{
                background-color: #fffaf0;
                border-left-color: #dd6b20;
            }}
            .alert-danger {{
                background-color: #fff5f5;
                border-left-color: #e53e3e;
            }}
            .highlight {{
                font-size: 20px;
                color: #2b6cb0;
                font-weight: 700;
                letter-spacing: 1px;
                background: #ebf8ff;
                padding: 8px 16px;
                border-radius: 4px;
                display: inline-block;
            }}
            .center-align {{
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="container">
                <div class="header">
                    <h1>NMIMS EMS</h1>
                </div>
                <div class="content">
                    {content_html}
                </div>
                <div class="footer">
                    <p>This is an automated message from the NMIMS Event Management System.</p>
                    <p>&copy; 2026 SVKM's NMIMS. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def notify_temporary_password(user_email: str, temporary_password: str, is_reset: bool = False):
    action = "Reset" if is_reset else "Generation"
    subject = f"[EMS] Temporary Password {action}"
    
    greeting = "Welcome to EMS!" if not is_reset else "Password Reset Request"
    instructions = ("log in and complete your profile" if not is_reset 
                    else "log in and change your password immediately")

    content_html = f"""
    <h2>{greeting}</h2>
    <p>A temporary password has been generated for your account.</p>
    
    <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #718096; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Login Email</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #2d3748; font-weight: 500;">{user_email}</p>
        
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #718096; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Temporary Password</p>
        <div style="display: inline-block; padding: 12px 24px; background-color: #ffffff; border: 2px dashed #cbd5e0; border-radius: 6px;">
            <code style="font-size: 22px; color: #2b6cb0; font-weight: 700; letter-spacing: 2px; font-family: monospace; user-select: all; cursor: copy;">{temporary_password}</code>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #a0aec0;"><i>(Double-click the password to easily highlight and copy it)</i></p>
    </div>

    <div class="alert alert-warning">
        <p style="margin-top: 0;"><b>Action Required:</b> Please {instructions}.</p>
        <p style="margin-bottom: 0; font-size: 14px; color: #718096;"><i>Note: Store this securely and do not share it with anyone.</i></p>
    </div>
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/login" class="btn">Log In Now</a>
    </div>
    """
    body = _build_email_html(content_html)
    send_email.delay(user_email, subject, body, None, "auth_temp_password")

def notify_event_submitted(event: Any, associate_dean: Any):
    subject = f"[EMS] Action Required: New Event Submitted - {event.title}"
    content_html = f"""
    <h2>New Event Submitted For Review</h2>
    <p>Dear Associate Dean,</p>
    <p>A new event proposal has been submitted and is waiting for your review.</p>
    
    <table>
      <tr><td>Event Title</td><td>{event.title}</td></tr>
      <tr><td>Category</td><td>{event.event_type}</td></tr>
      <tr><td>Date &amp; Time</td><td>{event.start_datetime.strftime('%d %B %Y, %I:%M %p')}</td></tr>
      <tr><td>Venue</td><td>{event.venue_custom or 'Predefined Venue'}</td></tr>
      <tr><td>Proposed Budget</td><td>&#8377;{float(event.budget):,.2f}</td></tr>
    </table>
    
    <div class="alert">
        <p style="margin: 0;">Please review the provided details, documents, and IT/Food requirements to process the approval.</p>
    </div>
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/admin/events/{event.id}" class="btn">Review Event</a>
    </div>
    """
    body = _build_email_html(content_html)
    send_email.delay(associate_dean.email, subject, body, event.id, "event_submitted")


def notify_collab_approval_needed(event: Any, coordinator: Any):
    """Notify a collaborating club's coordinator that their approval is needed."""
    subject = f"[EMS] Collaboration Approval Needed: {event.title}"
    content_html = f"""
    <h2>Collaborative Event — Your Approval Required</h2>
    <p>Dear Coordinator,</p>
    <p>A collaborative event has been submitted that involves your club. Your approval is required before it can proceed through the approval chain.</p>
    
    <table>
      <tr><td>Event Title</td><td>{event.title}</td></tr>
      <tr><td>Category</td><td>{event.event_type}</td></tr>
      <tr><td>Date &amp; Time</td><td>{event.start_datetime.strftime('%d %B %Y, %I:%M %p')}</td></tr>
      <tr><td>Venue</td><td>{event.venue_custom or 'Predefined Venue'}</td></tr>
      <tr><td>Proposed Budget</td><td>&#8377;{float(event.budget):,.2f}</td></tr>
    </table>
    
    <div class="alert">
        <p style="margin: 0;">Please review the event details and approve or reject this collaboration request.</p>
    </div>
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/admin/events/{event.id}" class="btn">Review &amp; Approve</a>
    </div>
    """
    body = _build_email_html(content_html)
    send_email.delay(coordinator.email, subject, body, event.id, "collab_approval_needed")


def notify_event_approved_by_director(event: Any, coordinator: Any):
    subject = f"[EMS] ✅ Event Fully Approved: {event.title}"
    content_html = f"""
    <h2>Your Event is Officially Approved!</h2>
    <p>Congratulations!</p>
    <p>Your event <b>{event.title}</b> has secured final approval from the Director.</p>
    
    <div class="alert" style="border-left-color: #38a169; background-color: #f0fff4;">
        <p style="margin: 0; color: #2f855a;"><b>Status:</b> Official &amp; Active</p>
        <p style="margin: 10px 0 0 0;">You may now proceed with final preparations, logistics, and student registrations.</p>
    </div>
    
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/events/{event.id}" class="btn">Manage Event</a>
    </div>
    """
    body = _build_email_html(content_html)
    send_email.delay(coordinator.email, subject, body, event.id, "event_fully_approved")


def notify_pending_director(event: Any, director: Any):
    subject = f"[EMS] Pending Final Approval: {event.title}"
    content_html = f"""
    <h2>Event Pending Director's Approval</h2>
    <p>Dear Director,</p>
    <p>The event <b>{event.title}</b> has been vetted and approved by the Associate Dean. It now requires your final authorization.</p>
    
    <table>
      <tr><td>Event Title</td><td>{event.title}</td></tr>
      <tr><td>Date &amp; Time</td><td>{event.start_datetime.strftime('%d %B %Y, %I:%M %p')}</td></tr>
      <tr><td>Projected Budget</td><td>&#8377;{float(event.budget):,.2f}</td></tr>
    </table>
    
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/admin/events/{event.id}" class="btn">Review &amp; Authorize</a>
    </div>
    """
    body = _build_email_html(content_html)
    send_email.delay(director.email, subject, body, event.id, "pending_director")


def notify_event_rejected(event: Any, recipients: List[Any], remarks: str, rejected_by_role: str):
    subject = f"[EMS] ❌ Event Rejected: {event.title}"
    formatted_role = rejected_by_role.replace('_', ' ').title()
    content_html = f"""
    <h2 style="color: #e53e3e;">Event Rejection Notice</h2>
    <p>We regret to inform you that your event proposal <b>{event.title}</b> has been rejected by the {formatted_role}.</p>
    
    <div class="alert alert-danger">
        <p style="margin-top: 0; font-weight: 600;">Reason for Rejection:</p>
        <p style="margin-bottom: 0;">{remarks}</p>
    </div>
    
    <p>Please review the feedback carefully. You may make the required adjustments and submit a new proposal if applicable.</p>
    """
    body = _build_email_html(content_html)
    for user in recipients:
        send_email.delay(user.email, subject, body, event.id, "event_rejected")


def notify_suggest_changes(event: Any, recipients: List[Any], remarks: str, by_role: str):
    subject = f"[EMS] Action Required: Changes Requested for {event.title}"
    formatted_role = by_role.replace('_', ' ').title()
    content_html = f"""
    <h2>Changes Requested for Event</h2>
    <p>The {formatted_role} has reviewed your event proposal <b>{event.title}</b> and requested specific changes before it can be approved.</p>
    
    <div class="alert alert-warning">
        <p style="margin-top: 0; font-weight: 600;">Feedback &amp; Required Changes:</p>
        <p style="margin-bottom: 0;">{remarks}</p>
    </div>
    
    <p>Please log in to the system, update your event details or documents accordingly, and resubmit it to advance the approval process.</p>
    
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/events/{event.id}/edit" class="btn">Update Event Details</a>
    </div>
    """
    body = _build_email_html(content_html)
    for user in recipients:
        send_email.delay(user.email, subject, body, event.id, "suggest_changes")


def notify_registration_confirmation(event: Any, student: Any):
    subject = f"[EMS] Registration Confirmed: {event.title}"
    content_html = f"""
    <h2>Registration Confirmed!</h2>
    <p>Hi <b>{student.name}</b>,</p>
    <p>You have successfully secured your spot for the upcoming event!</p>
    
    <table>
      <tr><td>Event</td><td>{event.title}</td></tr>
      <tr><td>Date</td><td>{event.start_datetime.strftime('%d %B %Y')}</td></tr>
      <tr><td>Time</td><td>{event.start_datetime.strftime('%I:%M %p')}</td></tr>
      <tr><td>Venue</td><td>{event.venue_custom or 'See EMS Portal'}</td></tr>
    </table>
    
    <p>Be sure to mark your calendar! Check the event page for any mandatory forms, payment links, or participant documents.</p>
    
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/events" class="btn">View My Events</a>
    </div>
    """
    body = _build_email_html(content_html)
    send_email.delay(student.email, subject, body, event.id, "registration_confirmation")


def notify_visitor_registration_confirmation(event: Any, visitor_name: str, visitor_email: str):
    """Send the same confirmation to an outside-campus visitor."""
    visitor = type("Visitor", (), {"name": visitor_name, "email": visitor_email})()
    notify_registration_confirmation(event, visitor)


def notify_event_cancelled(event: Any, registered_students: List[Any], reason: str):
    subject = f"[EMS] Important Update: Event Cancelled - {event.title}"
    content_html = f"""
    <h2 style="color: #e53e3e;">Event Cancellation Notice</h2>
    <p>Dear Student,</p>
    <p>We regret to inform you that the event <b>{event.title}</b> you were registered for has unfortunately been cancelled.</p>
    
    <div class="alert alert-danger">
        <p style="margin-top: 0; font-weight: 600;">Reason for Cancellation:</p>
        <p style="margin-bottom: 0;">{reason}</p>
    </div>
    
    <p>We sincerely apologize for any inconvenience this may cause. Any relevant reimbursements or alternative arrangements will be communicated to you by the organizing committee.</p>
    """
    body = _build_email_html(content_html)
    emails = [s if isinstance(s, str) else s.email for s in registered_students]
    send_bulk_email.delay(emails, subject, body, event.id, "event_cancelled")


def notify_event_details_updated(event: Any, registered_students: List[Any]):
    subject = f"[EMS] Event Details Updated: {event.title}"
    content_html = f"""
    <h2>Event Details Have Changed</h2>
    <p>Dear Student,</p>
    <p>The organizing committee has made updates to the details of <b>{event.title}</b>.</p>
    
    <div class="alert">
        <p style="margin: 0;">This may impact timings, venue, or requirements. Please review the updated event details to stay informed.</p>
    </div>
    
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/events" class="btn">View Updated Details</a>
    </div>
    """
    body = _build_email_html(content_html)
    emails = [s.email for s in registered_students]
    send_bulk_email.delay(emails, subject, body, event.id, "event_details_updated")


def notify_collab_chain_restarted(event: Any, coordinators: List[Any], edited_by_name: str):
    """Notify all collaborating coordinators that the approval chain has restarted due to an edit."""
    subject = f"[EMS] Approval Chain Restarted: {event.title}"
    content_html = f"""
    <h2>Collaborative Event — Approval Chain Restarted</h2>
    <p>Dear Coordinator,</p>
    <p>The collaborative event <b>{event.title}</b> has been edited by <b>{edited_by_name}</b>. 
    As a result, the approval chain has been <strong>restarted from the beginning</strong>.</p>
    
    <table>
      <tr><td>Event Title</td><td>{event.title}</td></tr>
      <tr><td>Date &amp; Time</td><td>{event.start_datetime.strftime('%d %B %Y, %I:%M %p')}</td></tr>
      <tr><td>Edited By</td><td>{edited_by_name}</td></tr>
    </table>
    
    <div class="alert alert-warning">
        <p style="margin: 0;">Your re-approval is required before this event can proceed through the approval chain again.</p>
    </div>
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/admin/events/{event.id}" class="btn">Review &amp; Re-Approve</a>
    </div>
    """
    body = _build_email_html(content_html)
    for coord in coordinators:
        send_email.delay(coord.email, subject, body, event.id, "collab_chain_restarted")


def notify_faculty_and_coordinators_involved(event: Any, recipients: List[str], event_action: str = "created"):
    """
    Notify all Faculty Involved and involved Coordinators when an event is created or submitted.
    Does NOT send to Dean or Director.
    """
    if not recipients:
        return

    # Deduplicate valid emails
    unique_emails = set()
    for em in recipients:
        if em and isinstance(em, str) and "@" in em:
            unique_emails.add(em.strip().lower())

    if not unique_emails:
        return

    action_text = "created and listed" if event_action == "created" else "submitted for approval"
    subject = f"[EMS] Event {event_action.title()}: {event.title}"
    content_html = f"""
    <h2>Event Notification — You Are Listed as Involved</h2>
    <p>Dear Faculty / Coordinator,</p>
    <p>The event proposal <b>{event.title}</b> has been {action_text}. You are listed as an involved Faculty In-Charge or Coordinator for this event.</p>
    
    <table>
      <tr><td>Event Title</td><td>{event.title}</td></tr>
      <tr><td>Event Type</td><td>{event.event_type}</td></tr>
      <tr><td>School / Department</td><td>{getattr(event, 'school_department', None) or 'N/A'}</td></tr>
      <tr><td>Event In-Charge</td><td>{event.event_incharge_name} ({event.event_incharge_contact})</td></tr>
      <tr><td>Date &amp; Time</td><td>{event.start_datetime.strftime('%d %B %Y, %I:%M %p')}</td></tr>
      <tr><td>Venue</td><td>{getattr(event, 'venue_custom', None) or 'Predefined Venue'}</td></tr>
      <tr><td>Proposed Budget</td><td>&#8377;{float(event.budget):,.2f}</td></tr>
    </table>
    
    <div class="alert">
        <p style="margin: 0;">You can log in to the EMS portal to view complete event details, schedule, and assets.</p>
    </div>
    <div class="center-align">
        <a href="{settings.FRONTEND_URL}/events/{event.id}" class="btn">View Event Details</a>
    </div>
    """
    body = _build_email_html(content_html)
    for email in unique_emails:
        send_email.delay(email, subject, body, event.id, "faculty_involved_notification")
