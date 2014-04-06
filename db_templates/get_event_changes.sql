select u.username, c.date at time zone 'utc' as date, c.new as new_values
from change c
inner join registered_user u on u.id = c.user_id
where event_id = $1
order by date desc
;
