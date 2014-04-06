select
  change.id,
  date at time zone 'utc' as date,
  username,
  event_id, place_id, thing_id, type_id,
  old, new as new_values
from change
inner join registered_user on registered_user.id = change.user_id
order by date desc
limit 200
;
