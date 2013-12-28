insert into registered_user(github_id, email, name)
values ('<%= github_id %>', '<%= email %>', '<%= name %>')
returning id, name, email;