select
  t.id as thing_id,
  count(e.id) as event_count,
  t.name as thing_name,
  t.link as thing_link,
  type.name as thing_type_name,
  min(e.start_date AT TIME ZONE 'UTC') as start_date,
  max(e.end_date AT TIME ZONE 'UTC') as end_date,
  ST_Extent(p.location) as area,
  max(case
    when thing_importance.value is null then 4 * event_importance.value
    else thing_importance.value * event_importance.value * 2
  end) as importance_value

from thing t
inner join type on type.id = t.type_id
inner join place p on p.thing_id = t.id
inner join event e on e.place_id = t.id
inner join importance event_importance on event_importance.id = e.importance_id
left join thing_subtype tst on tst.thing_id = t.id
left join importance thing_importance on tst.importance_id = thing_importance.id

where lower(f_unaccent(t.name)) ilike lower(f_unaccent($1))

group by t.id, type.id

order by
  event_count desc,
  thing_name asc

limit 500;
