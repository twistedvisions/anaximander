(
  select
    'edit' as mode,
    case
      when change.event_id is not null then event.name
      when change.thing_id is not null then thing.name
      when change.type_id is not null then type.name
      when change.importance_id is not null then importance.name
      else ''
    end as name,
    case
      when change.event_id is not null then 'event'
      when change.thing_id is not null then 'thing'
      when change.type_id is not null then 'type'
      when change.importance_id is not null then 'importance'
      else ''
    end as type,
    'change_' || change.id as id,
    date at time zone 'utc' as date,
    username,
    change.event_id, change.place_id, change.thing_id, change.type_id,
    old as old_values,
    new as new_values
  from change
  inner join registered_user on registered_user.id = change.user_id
  left join event on change.event_id = event.id
  left join thing on change.thing_id = thing.id
  left join type on change.type_id = type.id
  left join importance on change.importance_id = importance.id
  order by date desc
  limit 200
)

union all

(
  select
    'creation' as mode,
    e.name as name,
    'event' as type,
    'event_' || e.id as id,
    c.date at time zone 'utc' as date,
    username,
    e.id, null, null, null,
    row_to_json(null) as old_values,
    (
      select row_to_json(event_data)
      from (
        select
          e.name,
          e.start_date at time zone 'utc',
          e.end_date at time zone 'utc',
          e.type_id,
          e.importance_id,
          e.link,
          e.place_id,
          array_to_json(array_agg(row_to_json(p))) as participants
        from (
          select ep.thing_id, ep.role_id, ep.importance_id
          from event_participant ep
          where ep.event_id = e.id
        ) p
      ) as event_data
    ) as new_values
  from creator c
  inner join registered_user on registered_user.id = c.user_id
  inner join event e on e.creator_id = c.id
  order by c.date desc
  limit 200
)

union all

(
  select
    'creation' as mode,
    t.name as name,
    'thing' as type,
    'thing_' || t.id as id,
    c.date at time zone 'utc' as date,
    username,
    t.id, null, null, null,
    row_to_json(null) as old_values,
    (
      select row_to_json(thing_data)
      from (
        select
          t.name,
          t.link,
          t.type_id,
          array_to_json(array_agg(row_to_json(st))) as subtypes
        from (
          select tst.thing_type_id as type_id, tst.importance_id
          from thing_subtype tst
          where tst.thing_id = t.id
        ) st
      ) as thing_data
    ) as new_values
  from creator c
  inner join registered_user on registered_user.id = c.user_id
  inner join thing t on t.creator_id = c.id
  order by c.date desc
  limit 200
)

union all

(
  select
    'creation' as mode,
    t.name as name,
    'type' as type,
    'type_' || t.id as id,
    c.date at time zone 'utc' as date,
    username,
    t.id, null, null, null,
    row_to_json(null) as old_values,
    (
      select row_to_json(type_data)
      from (
        select
          t.name,
          t.type_id,
          t.parent_type_id,
          t.default_importance_id
      ) as type_data
    ) as new_values
  from creator c
  inner join registered_user on registered_user.id = c.user_id
  inner join type t on t.creator_id = c.id
  order by c.date desc
  limit 200
)

union all

(
  select
    'creation' as mode,
    i.name as name,
    'importance' as type,
    'importance_' || i.id as id,
    c.date at time zone 'utc' as date,
    username,
    i.id, null, null, null,
    row_to_json(null) as old_values,
    (
      select row_to_json(importance_data)
      from (
        select
          i.name,
          i.description,
          i.value,
          i.type_id
      ) as importance_data
    ) as new_values
  from creator c
  inner join registered_user on registered_user.id = c.user_id
  inner join importance i on i.creator_id = c.id
  order by c.date desc
  limit 200
)

order by date desc
limit 200
