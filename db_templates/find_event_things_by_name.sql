select
  t.id as thing_id,
  count(e.id) as event_count,
  t.name as thing_name,
  t.link as thing_link,
  thing_type.name as thing_type_name,
  min(e.start_date) as start_date,
  max(e.end_date) as end_date,
  ST_Extent(p.location) as area

from thing t
inner join thing_type on thing_type.id = t.type_id
inner join event_participant ep on ep.thing_id = t.id
inner join event e on e.id = ep.event_id
inner join thing pt on pt.id = e.place_id
inner join place p on p.thing_id = pt.id

where t.name ilike $1

group by t.id, thing_type.name

order by
  event_count desc,
  thing_name asc