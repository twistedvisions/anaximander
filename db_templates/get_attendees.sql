select
  thing.id as id,
  thing.name as name,
  thing_type.name as type
from thing
inner join thing_type on thing.type_id = thing_type.id
where thing.type_id != 3
and thing.name ilike '%' || $1 || '%'
order by thing.name asc
limit 50