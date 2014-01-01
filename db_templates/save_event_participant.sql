insert into event_participant (
  event_id, 
  thing_id
)
values (
  <%= event_id %>,
  <%= attendee_id %>
);
