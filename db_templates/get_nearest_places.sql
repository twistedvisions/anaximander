select
  place_thing.id as id,
  place_thing.name as name,
  ST_AsText(place.location) as location,
  ST_Distance_Sphere (
    place.location,
    ST_SetSRID(ST_Point($1, $2), 4326)
  ) as distance
from thing as place_thing
inner join place on place.thing_id = place_thing.id
where  ST_Distance (
  ST_SetSRID(ST_Point($1, $2), 4326),
  place.location
) < 50000
order by distance asc
limit 50
