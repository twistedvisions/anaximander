select id, username, password
from registered_user
where username = $1;