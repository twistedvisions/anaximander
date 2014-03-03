insert into importance (name, description, type_id, value)
values ($1, $2, $3, $4)
returning id;