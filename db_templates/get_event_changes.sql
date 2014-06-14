select
  e.name as name,
  'event' as type,
  u.username,
  c.date at time zone 'utc' as date,
  c.old as old_values,
  c.new as new_values
from change c
inner join registered_user u on u.id = c.user_id
inner join event e on e.id = c.event_id
where event_id = $1
order by date desc
;
