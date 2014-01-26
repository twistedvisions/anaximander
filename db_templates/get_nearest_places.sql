select
  place_thing.id as id,
  place_thing.name as name,
  ST_AsText(place.location) as location,
  ST_Distance_Sphere (
    place.location,
    ST_Point($1, $2)
  ) as distance
from thing as place_thing
inner join place on place.thing_id = place_thing.id
where  ST_Distance (
  ST_Point($1, $2),
  place.location
) < 50000
order by distance asc
limit 50
