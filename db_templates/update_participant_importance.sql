update event_participant
set importance_id = $3
where event_id = $1
and thing_id = $2
