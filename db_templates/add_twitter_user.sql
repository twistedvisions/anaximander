insert into registered_user(twitter_id, email, name)
values ('<%= twitter_id %>', '<%= email %>', '<%= name %>')
returning id, name, email;