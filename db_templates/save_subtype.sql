insert into type (creator_id, name, type_id, parent_type_id)
values ($1, $2, $3, $4)
returning id;