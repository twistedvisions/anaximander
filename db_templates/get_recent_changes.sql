select
  case
    when event_id is not null then event.name
    else ''
  end as name,
  case
    when event_id is not null then 'event'
    else ''
  end as type,
  change.id,
  date at time zone 'utc' as date,
  username,
  change.event_id, change.place_id, change.thing_id, change.type_id,
  old, new as new_values
from change
inner join registered_user on registered_user.id = change.user_id
inner join event on change.event_id = event.id
order by date desc
limit 200
;
