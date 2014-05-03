select
  type.id as id,
  type.name as name,
  type.default_importance_id as default_importance_id,
  importance.id as importance_id,
  importance.name as importance_name,
  importance.description as importance_description,
  importance.value as importance_value
from type
inner join importance on importance.type_id = type.id
where type.type_id = $1
order by name asc, importance.name asc;