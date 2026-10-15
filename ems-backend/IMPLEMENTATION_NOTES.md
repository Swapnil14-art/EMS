# Event registration audience

`faculty_registration_enabled` is persisted and exposed so an event can declare a faculty audience. The current application has no faculty-capable registration role or registration record flow: `/registrations/{event_id}/register` remains restricted to `student` users and additionally requires `student_registration_enabled`. Faculty accounts are not treated as students or implicitly allowed to use that endpoint.
