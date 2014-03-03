insert into event_participant (
  event_id,
  thing_id,
  role_id,
  importance_id
)
values ($1, $2, $3, $4);
