select type.id, count(*) as usage
from thing_subtype
inner join type on type.id = thing_subtype.thing_type_id
where type.type_id = 4
and type.parent_type_id = $1
group by type.id
