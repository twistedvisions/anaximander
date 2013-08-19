select 
  person.name, 
  place.name, 
  ST_AsText(place.location) as location
from place 
inner join event on event.place_id = place.id
inner join event_attendee on event_attendee.event_id = event.id
inner join person on person.id = event_attendee.person_id
where ST_MaxDistance (
  place.location,
  ST_PointFromText('POINT(<%=lon%> <%=lat%>)')
) < 100
;
