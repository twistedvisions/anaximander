insert into thing (
  name, 
  type_id, 
  link
)
values ($1, $2, $3)
returning id;