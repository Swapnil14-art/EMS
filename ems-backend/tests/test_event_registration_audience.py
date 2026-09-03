import unittest
from datetime import datetime, timedelta, timezone

from pydantic import ValidationError

from app.models.event import Event
from app.routers.events import synchronize_registration_audience
from app.schemas.event import EventCreate, EventUpdate


def event_payload(**overrides):
    payload = {
        "title": "Audience test event",
        "event_type": "workshop",
        "school_department": "Engineering",
        "event_incharge_name": "Test Coordinator",
        "event_incharge_contact": "+911234567890",
        "target_audience": "Engineering",
        "start_datetime": datetime.now(timezone.utc) + timedelta(days=2),
        "end_datetime": datetime.now(timezone.utc) + timedelta(days=2, hours=1),
    }
    payload.update(overrides)
    return payload


class EventAudienceSchemaTests(unittest.TestCase):
    def test_faculty_emails_are_normalized_and_allow_edu_and_in(self):
        event = EventCreate(**event_payload(faculty_involved_emails=[" Faculty@University.EDU ", "dean@campus.IN"]))
        self.assertEqual(event.faculty_involved_emails, ["faculty@university.edu", "dean@campus.in"])

    def test_invalid_or_duplicate_faculty_emails_are_rejected(self):
        with self.assertRaises(ValidationError):
            EventCreate(**event_payload(faculty_involved_emails=["faculty@example.com"]))
        with self.assertRaises(ValidationError):
            EventUpdate(faculty_involved_emails=["faculty@campus.edu", "FACULTY@campus.edu"])

    def test_omitted_new_fields_are_backward_compatible(self):
        event = EventCreate(**event_payload())
        self.assertIsNone(event.faculty_involved_emails)
        self.assertFalse(event.student_registration_enabled)
        self.assertFalse(event.faculty_registration_enabled)


class RegistrationAudienceInvariantTests(unittest.TestCase):
    def _event(self, student=False, faculty=False, outside=False):
        return Event(
            student_registration_enabled=student,
            faculty_registration_enabled=faculty,
            outside_campus_registration=outside,
            registration_accepted=False,
            registration_start_datetime=datetime.now(timezone.utc),
            registration_deadline=datetime.now(timezone.utc),
        )

    def test_student_only_faculty_only_and_both_enable_registration(self):
        for student, faculty in ((True, False), (False, True), (True, True)):
            event = self._event(student, faculty)
            synchronize_registration_audience(event)
            self.assertTrue(event.registration_accepted)

    def test_neither_forces_registration_off_and_clears_dates(self):
        event = self._event()
        synchronize_registration_audience(event)
        self.assertFalse(event.registration_accepted)
        self.assertIsNone(event.registration_start_datetime)
        self.assertIsNone(event.registration_deadline)

    def test_outside_registration_keeps_registration_enabled(self):
        event = self._event(outside=True)
        synchronize_registration_audience(event)
        self.assertTrue(event.registration_accepted)


if __name__ == "__main__":
    unittest.main()
