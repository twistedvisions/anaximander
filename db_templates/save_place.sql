insert into place (
  thing_id,
  location
)
values ($1, ST_Point($2, $3))
returning id;
