select id, email, name, last_save_time
from registered_user
where id = $1
