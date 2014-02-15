insert into event (
  name,
  type_id,
  place_id,
  start_date,
  end_date,
  link
)
values ($1, $2, $3, $4, $5, $6)
returning id;
