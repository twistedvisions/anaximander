select 
  permission.id as id,
  permission.name as name
from user_permission 
inner join permission on permission.id = user_permission.permission_id
where user_permission.user_id = $1
order by id asc
