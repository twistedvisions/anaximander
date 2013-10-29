select 
  thing.name as thing_name, 
  thing_type.name as thing_type,
  event.name as event_name,
  event.link as event_link, 
  event.start_date,
  event.end_date,
  ST_AsText(place.location) as location,
  ST_Distance (
    place.location,
    ST_Point(<%= lon %>, <%= lat %>)
  ) as distance
from thing as place_thing
inner join place on place.thing_id = place_thing.id 
inner join event on event.place_id = place_thing.id
inner join event_participant on event_participant.event_id = event.id
inner join thing on event_participant.thing_id = thing.id
inner join thing_type on thing.type_id = thing_type.id
<%= (
  eventFilters.length > 0 ? 
  "left join thing_subtype on thing.id = thing_subtype.thing_id" : 
  ""
) %>
where  ST_Covers (
  ST_GeographyFromText('POLYGON((
    <%= ne_lon %> <%= ne_lat %>,
    <%= ne_lon %> <%= sw_lat %>,
    <%= sw_lon %> <%= sw_lat %>,
    <%= sw_lon %> <%= ne_lat %>,
    <%= ne_lon %> <%= ne_lat %>))'),
  place.location
)
and event.start_date >= '<%= start %>'
and event.end_date <= '<%= end %>'
<%= eventFilters %>
group by thing.name, thing_type.name, place_thing.name,
  event.name,
  event.link, 
  event.start_date,
  event.end_date,
  place.location
order by distance asc
limit 200