insert into importance (creator_id, name, description, type_id, value)
values ($1, lower($2), $3, $4, $5)
returning id;