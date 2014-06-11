select
  type.id as id,
  type.name as name,
  type.last_edited as last_edited,
  type.default_importance_id as default_importance_id,
  related_type.name as related_type,
  importance.id as importance_id,
  importance.name as importance_name,
  importance.description as importance_description,
  importance.value as importance_value,
  importance.last_edited as importance_last_edited
from type
inner join importance on importance.type_id = type.id
inner join type related_type on type.related_type_id = related_type.id
where type.type_id = 3
order by related_type asc, name asc, importance.name asc;
