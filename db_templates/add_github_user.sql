insert into registered_user(github_id, email, name, registration_date)
values ($1, $2, $3, now())
returning id, name, email;
