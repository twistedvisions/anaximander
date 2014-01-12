select
  thing.id as thing_id,
  place_thing.id as place_thing_id,
  thing.name as thing_name,
  thing_type.name as thing_type,
  event.id as event_id,
  event.name as event_name,
  event.link as event_link,
  event.start_date,
  event.end_date,
  ST_AsText(place.location) as location,
  ST_Distance (
    place.location,
    ST_Point($1, $2)
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
  ST_GeometryFromText('<%= boundingBox %>'),
  place.location
)
and event.start_date >= $3
and event.end_date <= $4
<%= eventFilters %>
group by
  thing.id,
  place_thing.id,
  thing.name,
  thing_type.name,
  place_thing.name,
  event.id,
  event.name,
  event.link,
  event.start_date,
  event.end_date,
  place.location
order by distance asc, event.start_date asc
limit 200