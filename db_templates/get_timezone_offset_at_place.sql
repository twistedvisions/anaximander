select normal_offset as offset, ds_offset
from place p
inner join timezone tz on ST_Within(p.location, tz.geom)
where p.id = $1
