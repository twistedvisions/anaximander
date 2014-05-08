select
  case
    when change.event_id is not null then event.name
    when change.thing_id is not null then thing.name
    when change.type_id is not null then type.name
    when change.importance_id is not null then importance.name
    else ''
  end as name,
  case
    when change.event_id is not null then 'event'
    when change.thing_id is not null then 'thing'
    when change.type_id is not null then 'type'
    when change.importance_id is not null then 'importance'
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
left join type on change.type_id = type.id
left join importance on change.importance_id = importance.id
order by date desc
limit 200
;
