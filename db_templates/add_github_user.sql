insert into registered_user(github_id, email, name)
values ($1, $2, $3)
returning id, name, email;
