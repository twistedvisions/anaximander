insert into type (creator_id, name, type_id, related_type_id)
values ($1, lower($2), 3, $3)
returning id;