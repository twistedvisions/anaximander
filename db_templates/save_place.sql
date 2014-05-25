insert into place (
  thing_id,
  location
)
values ($1, ST_SetSRID(ST_Point($2, $3), 4326))
returning id
