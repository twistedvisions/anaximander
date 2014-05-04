select
  type.id as id,
  type.name as name,
  type.last_edited as last_edited,
  type.default_importance_id as default_importance_id,
  importance.id as importance_id,
  importance.name as importance_name,
  importance.description as importance_description,
  importance.value as importance_value,
  importance.last_edited as importance_last_edited
from type
inner join importance on importance.type_id = type.id
where type.parent_type_id = $1
order by name asc, importance.name asc;
