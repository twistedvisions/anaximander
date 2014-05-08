select importance.id, count(*) as usage
from thing_subtype
inner join importance on importance.id = thing_subtype.importance_id
where thing_subtype.thing_type_id = $1
group by importance.id
