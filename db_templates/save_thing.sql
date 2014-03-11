insert into thing (
  creator_id,
  name,
  type_id,
  link
)
values ($$1, $2, $3, $4)
returning id;
