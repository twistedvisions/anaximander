
set enable_seqscan = off;

explain analyze select
  thing.name as thing_name,
  thing_type.name as thing_type,
  event.name as event_name,
  event.link as event_link,
  event.start_date,
  event.end_date,
  ST_AsText(place.location) as location,
  ST_Distance (
    place.location,
    ST_Point(0.349057342578174,  51.48635187074669)
  ) as distance
from thing as place_thing
inner join place on place.thing_id = place_thing.id
inner join event on event.place_id = place_thing.id
inner join event_participant on event_participant.event_id = event.id
inner join thing on event_participant.thing_id = thing.id
inner join thing_type on thing.type_id = thing_type.id

where  event.start_date >= '1970-01-01 00:00'
and event.end_date <= '2013-12-31 23:59'
and ST_Covers (
  ST_GeographyFromText('POLYGON((
    0.5248385925781349 51.5875745428145,
    0.5248385925781349 51.38490399240197,
    0.17327609257813492 51.38490399240197,
    0.17327609257813492 51.5875745428145,
    0.5248385925781349 51.5875745428145))'),
  place.location
)
group by thing.name, thing_type.name, place_thing.name,
  event.name,
  event.link,
  event.start_date,
  event.end_date,
  place.location
order by distance asc
limit 200;


set enable_seqscan = off;

explain analyze select
  ST_Distance (
    place.location,
    ST_Point(0.349057342578174,  51.48635187074669)
  ) as distance
from place
where ST_Covers (
  ST_GeographyFromText('POLYGON((
    0.5248385925781349 51.5875745428145,
    0.5248385925781349 51.38490399240197,
    0.17327609257813492 51.38490399240197,
    0.17327609257813492 51.5875745428145,
    0.5248385925781349 51.5875745428145))'),
  place.location
)
order by distance asc
limit 200;

