select
  p.id as id,
  p.name as name
from user_permission up
inner join permission_group pg on pg.id = up.permission_group_id
inner join permission_group_permission pgp on pgp.permission_group_id = pg.id
inner join permission p on p.id = pgp.permission_id
where up.user_id = $1
order by id asc
