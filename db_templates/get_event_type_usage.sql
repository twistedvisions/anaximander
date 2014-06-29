select type.id, count(*) as usage
from event
inner join type on type.id = event.type_id
where type.type_id = 2
and event.deleted = 'false'
group by type.id
