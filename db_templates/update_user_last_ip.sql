update registered_user
set last_ip = $2
where id = $1
