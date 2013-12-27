insert into registered_user(google_id, email, name)
values ('<%= google_id %>', '<%= email %>', '<%= name %>')
returning id, name, email;