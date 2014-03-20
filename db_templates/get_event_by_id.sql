select
  event.id,
  event.name,
  place_thing.id as place_id,
  place_thing.name as place_name,
  ST_AsGeoJSON(place.location) as location,
  event.type_id as type_id,
  event.importance_id as importance_id,
  event.link as link,
  event.start_date,
  event.end_date,
  participant.id as participant_id,
  participant.name as participant_name,
  event_participant.role_id as participant_type_id,
  event_participant.importance_id as participant_importance_id
from event
inner join thing place_thing on event.place_id = place_thing.id
inner join place on place_thing.id = place.thing_id
inner join event_participant on event.id = event_participant.event_id
inner join thing participant on event_participant.thing_id = participant.id
where event.id = $1
;
