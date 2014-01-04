insert into registered_user (username, password)
values ($1, $2)
returning id;
