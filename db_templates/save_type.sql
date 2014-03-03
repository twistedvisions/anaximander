insert into type (name, type_id)
values ($1, $2)
returning id;