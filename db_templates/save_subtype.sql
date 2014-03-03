insert into type (name, type_id, parent_type_id)
values ($1, $2, $3)
returning id;