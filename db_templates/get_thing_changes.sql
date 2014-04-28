select
  t.name as name,
  'thing' as type,
  u.username,
  c.date at time zone 'utc' as date,
  c.new as new_values
from change c
inner join registered_user u on u.id = c.user_id
inner join thing t on t.id = c.thing_id
where thing_id = $1
order by date desc
;
