select id, email, name from registered_user
where github_id = $1
