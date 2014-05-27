update registered_user
set last_save_time = now()
where id = $1
