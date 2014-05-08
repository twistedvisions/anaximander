update type
set name = lower($2)
where id = $1
