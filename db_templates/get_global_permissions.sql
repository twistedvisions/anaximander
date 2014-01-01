select 
  permission.id as id,
  permission.name as name
from permission 
where permission.is_global = true
order by id asc
