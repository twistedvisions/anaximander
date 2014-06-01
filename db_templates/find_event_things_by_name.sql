select
  matching_thing.thing_id as thing_id,
  count(matching_thing.event_id) as event_count,
  matching_thing.thing_name as thing_name,
  matching_thing.thing_link as thing_link,
  matching_thing.thing_type_name as thing_type_name,
  min(matching_thing.start_date) as start_date,
  max(matching_thing.end_date) as end_date,
  ST_Extent(matching_thing.location) as area,
  array_agg(matching_thing.importance_value) as importance_values,
  ST_AsGeoJSON(ST_MakeLine(matching_thing.location)) as points,
  array_agg(matching_thing.start_date) as dates

from (
  select
    t.id as thing_id,
    e.id as event_id,
    t.name as thing_name,
    t.link as thing_link,
    type.name as thing_type_name,
    e.start_date as start_date,
    e.end_date as end_date,
    p.location as location,
    max(case
      when thing_importance.value is null then role_importance.value * 5 * event_importance.value
      else role_importance.value * thing_importance.value * event_importance.value
    end) as importance_value
  from thing t
  inner join type on type.id = t.type_id
  inner join event_participant ep on ep.thing_id = t.id
  inner join event e on e.id = ep.event_id
  inner join thing pt on pt.id = e.place_id
  inner join place p on p.thing_id = pt.id
  inner join importance event_importance on event_importance.id = e.importance_id
  inner join importance role_importance on role_importance.id = ep.importance_id
  left join thing_subtype tst on tst.thing_id = t.id
  left join importance thing_importance on tst.importance_id = thing_importance.id

  where t.name ilike $1
  group by t.id, e.id, type.id, p.id
  order by start_date
) matching_thing

group by thing_id, thing_name, thing_link, thing_type_name

order by
  event_count desc,
  thing_name asc

limit 500;
