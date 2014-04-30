select
  case
    when event_id is not null then event.name
    when thing_id is not null then thing.name
    else ''
  end as name,
  case
    when event_id is not null then 'event'
    when thing_id is not null then 'thing'
    else ''
  end as type,
  change.id,
  date at time zone 'utc' as date,
  username,
  change.event_id, change.place_id, change.thing_id, change.type_id,
  old, new as new_values
from change
inner join registered_user on registered_user.id = change.user_id
left join event on change.event_id = event.id
left join thing on change.thing_id = thing.id
order by date desc
limit 200
;
