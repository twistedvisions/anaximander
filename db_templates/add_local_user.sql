insert into registered_user (username, password, registration_date)
values ($1, $2, now())
returning id;
