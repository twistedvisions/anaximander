insert into registered_user(github_id, username, email, name, registration_date)
values ($1, $2, $3, $4, now())
returning id, name, email;
