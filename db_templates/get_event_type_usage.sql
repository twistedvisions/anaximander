select type.id, count(*) as usage
from event
inner join type on type.id = event.type_id
where type.type_id = 2
group by type.id
