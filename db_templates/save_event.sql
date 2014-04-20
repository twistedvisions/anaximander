insert into event (
  creator_id,
  name,
  type_id,
  importance_id,
  place_id,
  start_date,
  end_date,
  start_offset_seconds,
  end_offset_seconds,
  link
)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
returning id;
