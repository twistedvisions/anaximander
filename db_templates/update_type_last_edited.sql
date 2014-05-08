update type
set last_edited = now()
where id = $1
;
