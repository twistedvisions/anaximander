select type.id, count(*) as usage
from event_participant
inner join type on type.id = event_participant.role_id
where type.type_id = 3
group by type.id
