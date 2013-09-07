select 
  thing.name as thing_name, 
  thing_type.name as thing_type,
  place.name as place_name, 
  event.name as event_name,
  event.link as event_link, 
  event.start_date,
  event.end_date,
  ST_AsText(place.location) as location,
  ST_MaxDistance (
    place.location,
    ST_PointFromText('POINT(<%= lon %> <%= lat %>)')
  ) as distance
from place 
inner join event on event.place_id = place.id
left join event_participant on event_participant.event_id = event.id
left join thing on event_participant.thing_id = thing.id
left join thing_type on thing.type_id = thing_type.id
where  ST_MaxDistance (
  place.location,
  ST_PointFromText('POINT(<%= lon %> <%= lat %>)')
) < <%= radius %>
and event.start_date >= '<%= start %>'
and event.end_date <= '<%= end %>'
order by distance asc
limit 200
