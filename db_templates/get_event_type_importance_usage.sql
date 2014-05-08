select importance.id, count(*) as usage
from event
inner join importance on importance.id = event.importance_id
where event.type_id = $1
group by importance.id
