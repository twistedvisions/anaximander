select
  event_list.event_id,
  event_list.event_last_edited as event_last_edited,
  creator.user_id as creator_user_id,
  event_name,
  event_link,
  start_date,
  start_offset_seconds,
  end_date,
  end_offset_seconds,
  max_event_importance_value as event_importance_value,
  place_thing_id,
  place_thing_name,
  place_thing_link,
  location,
  distance,
  thing.id as thing_id,
  thing.name as thing_name,
  thing.link as thing_link,
  type.name as thing_type,
  case
    when thing_importance.value is null then event_importance_value * role_importance.value * 5
    else event_importance_value * role_importance.value * thing_importance.value
  end as importance_value
from (
  select
    event.id as event_id,
    event.last_edited as event_last_edited,
    event.creator_id as creator_id,
    event.name as event_name,
    event.link as event_link,
    event.start_date AT TIME ZONE 'UTC' as start_date,
    event.start_offset_seconds,
    event.end_date AT TIME ZONE 'UTC' as end_date,
    event.end_offset_seconds,
    case
      when thing_importance.value is null then role_importance.value * 5 * event_importance.value
      else role_importance.value * thing_importance.value * event_importance.value
    end as max_event_importance_value,
    event_importance.value as event_importance_value,
    place_thing.id as place_thing_id,
    place_thing.name as place_thing_name,
    place_thing.link as place_thing_link,
    ST_AsText(place.location) as location,
    ST_Distance (
      place.location,
      ST_SetSRID(ST_Point($1, $2), 4326)
    ) as distance
  from thing as place_thing
  inner join place on place.thing_id = place_thing.id
  inner join event on event.place_id = place_thing.id
  inner join event_participant on event_participant.event_id = event.id
  inner join thing on event_participant.thing_id = thing.id
  inner join type on thing.type_id = type.id
  inner join importance role_importance on event_participant.importance_id = role_importance.id
  left join thing_subtype on thing_subtype.thing_id = thing.id
  left join importance thing_importance on thing_subtype.importance_id = thing_importance.id
  inner join importance event_importance on event_importance.id = event.importance_id
  where  ST_Covers (
    ST_SetSRID(ST_GeometryFromText('<%= boundingBox %>'), 4326),
    place.location
  )
  and event.deleted = 'false'
  and (
    (event.start_date >= $3 and event.start_date <= $4) or
    (event.end_date >= $3 and event.end_date <= $4)
  )
  and case
        when thing_importance.value is null then role_importance.value * 5 * event_importance.value >= $5
        else role_importance.value * thing_importance.value * event_importance.value >= $5
      end
  <%= eventFilters %>
  group by
    thing.id,
    place_thing.id,
    type.id,
    event.id,
    place.id,
    max_event_importance_value,
    event_importance.value
  order by
    distance asc,
    event.start_date asc,
    event.id asc,
    thing.id asc
  limit 200
) event_list
inner join creator on creator.id = event_list.creator_id
inner join event_participant on event_participant.event_id = event_list.event_id
inner join thing on event_participant.thing_id = thing.id
inner join type on thing.type_id = type.id
inner join importance role_importance on event_participant.importance_id = role_importance.id
left join thing_subtype on thing_subtype.thing_id = thing.id
left join importance thing_importance on thing_subtype.importance_id = thing_importance.id
group by
  event_list.event_id,
  event_list.event_last_edited,
  event_list.event_name,
  event_list.event_link,
  event_list.start_date,
  event_list.start_offset_seconds,
  event_list.end_date,
  event_list.end_offset_seconds,
  event_list.max_event_importance_value,
  event_list.event_importance_value,
  event_list.place_thing_id,
  event_list.place_thing_name,
  event_list.place_thing_link,
  event_list.location,
  event_list.distance,
  creator.id,
  thing.id,
  type.id,
  importance_value
order by
  distance asc,
  start_date asc,
  event_id asc,
  thing_id asc
;
