select person.name, place.name
from place 
inner join event on event.place_id = place.id
inner join event_attendee on event_attendee.event_id = event.id
inner join person on person.id = event_attendee.person_id
where ST_CONTAINS(
  ST_BuildArea(place.location),
  ST_PointFromText('POINT(147.325 -42.880556  )')
)  = TRUE
;
