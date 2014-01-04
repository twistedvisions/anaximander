insert into registered_user(twitter_id, email, name)
values ($1, $2, $3)
returning id, name, email;
