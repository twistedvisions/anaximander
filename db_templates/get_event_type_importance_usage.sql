select importance.id, count(*) as usage
from event
inner join importance on importance.id = event.importance_id
where event.type_id = $1
and event.deleted = 'false'
group by importance.id
