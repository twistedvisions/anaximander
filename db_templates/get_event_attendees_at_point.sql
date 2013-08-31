select 
  person.name as person_name, 
  place.name as place_name, 
  event.name as event_name,
  event.link as event_link, 
  event.start_date,
  event.end_date,
  ST_AsText(place.location) as location
from place 
inner join event on event.place_id = place.id
left join event_attendee on event_attendee.event_id = event.id
left join person on event_attendee.person_id = person.id
where ST_MaxDistance (
  place.location,
  ST_PointFromText('POINT(<%= lon %> <%= lat %>)')
) < <%= radius %>
and event.start_date >= '<%= start %>'
and event.end_date <= '<%= end %>'
