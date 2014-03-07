select
  type.id as id,
  type.name as name,
  type.default_importance_id as default_importance_id,
  importance.id as importance_id,
  importance.name as importance_name
from type
inner join importance on importance.type_id = type.id
where type.parent_type_id = $1
order by name asc;
