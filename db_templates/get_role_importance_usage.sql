select importance.id, count(*) as usage
from event_participant
inner join importance on importance.id = event_participant.importance_id
where event_participant.role_id = $1
group by importance.id
