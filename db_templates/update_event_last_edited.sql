update event
set last_edited = now()
where id = $1
;
