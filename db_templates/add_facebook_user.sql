insert into registered_user(facebook_id, email, name)
values ('<%= facebook_id %>', '<%= email %>', '<%= name %>')
returning id, name, email;