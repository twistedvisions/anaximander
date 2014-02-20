select
  thing.id as id,
  thing.name as name,
  type.name as type
from thing
inner join type on thing.type_id = type.id
where thing.type_id != 3
and thing.name ilike '%' || $1 || '%'
order by thing.name asc
limit 50
