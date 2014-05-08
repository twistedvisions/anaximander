CREATE TABLE type
(
  id BIGSERIAL,
  name character varying(200) NOT NULL,
  type_id bigint REFERENCES type(id),
  parent_type_id bigint REFERENCES type(id),
  CONSTRAINT type_pkey PRIMARY KEY (id)
);

CREATE TABLE thing
(
  id BIGSERIAL,
  name character varying(200) NOT NULL,
  type_id bigint NOT NULL REFERENCES type(id),
  link character varying(200),
  CONSTRAINT person_pkey PRIMARY KEY (id)
);

CREATE TABLE place
(
  id BIGSERIAL,
  location geometry NOT NULL,
  thing_id bigint NOT NULL REFERENCES thing(id),
  CONSTRAINT place_pkey PRIMARY KEY (id)
);

CREATE TABLE thing_subtype
(
  thing_id bigint,
  thing_type_id bigint,
  CONSTRAINT thing_subtype_pkey PRIMARY KEY (thing_id, thing_type_id)
);

CREATE TABLE event
(
  id BIGSERIAL,
  name character varying(300) NOT NULL,
  place_id bigint NOT NULL REFERENCES thing(id),
  start_date timestamp with time zone NOT NULL,
  start_offset_seconds int NOT NULL,
  end_date timestamp with time zone NOT NULL,
  end_offset_seconds int NOT NULL,
  link character varying(200),
  type_id bigint REFERENCES type(id),
  CONSTRAINT event_pkey PRIMARY KEY (id)
);

CREATE TABLE event_participant
(
  thing_id bigint NOT NULL REFERENCES thing(id),
  event_id bigint NOT NULL REFERENCES event(id),
  role_id bigint NOT NULL REFERENCES type(id),
  CONSTRAINT event_attendee_pkey PRIMARY KEY (thing_id, event_id)
);

CREATE INDEX location_index
  ON place USING gist (location);

CREATE INDEX start_date_idx
  ON event USING btree (start_date ASC NULLS LAST);

CREATE INDEX end_date_idx
   ON event USING btree (end_date ASC NULLS LAST);

CREATE INDEX event_name_idx
   ON event (name ASC NULLS LAST);


CREATE INDEX thing_type_idx
   ON thing USING hash (type_id);

CREATE INDEX thing_name_idx
   ON thing (name ASC NULLS LAST);

CREATE INDEX event_id_idx
   ON event_participant USING hash (event_id);

CREATE INDEX place_idx
   ON event USING hash (place_id);

CREATE UNIQUE INDEX type_name
   ON type (name, parent_type_id);

CREATE EXTENSION pg_trgm;
CREATE INDEX thing_name_gin ON thing USING gin (name gin_trgm_ops);

INSERT INTO type (name, type_id, parent_type_id) VALUES ('type', NULL, NULL);
UPDATE type SET type_id = 1 WHERE id = 1;

ALTER TABLE type
ALTER COLUMN type_id
SET NOT NULL;

INSERT INTO type (name, type_id, parent_type_id) VALUES

  ('event type', 1, NULL),                 --2
  ('role', 1, NULL),                       --3
  ('thing type', 1, NULL),                 --4

  ('battle', 2, NULL),                     --5
  ('birth', 2, NULL),                      --6
  ('construction closing', 2, NULL),       --7
  ('construction commencement', 2, NULL),  --8
  ('construction opening', 2, NULL),       --9
  ('death', 2, NULL),                      --10
  ('organisation extinction', 2, NULL),    --11
  ('organisation foundation', 2, NULL),    --12
  ('place dissolution', 2, NULL),          --13
  ('place foundation', 2, NULL),           --14

  ('battle site', 3, NULL),                --15
  ('baby', 3, NULL),                       --16

  ('person', 4, NULL),                     --17
  ('organisation', 4, NULL),               --18
  ('place', 4, NULL),                      --19
  ('construction', 4, NULL),               --20

  ('defunct construction', 3, NULL),       --21
  ('construction site', 3, NULL),          --22
  ('new construction', 3, NULL),           --23
  ('dead person', 3, NULL),                --24
  ('defunct organisation', 3, NULL),       --25
  ('new organisation', 3, NULL),           --26
  ('defunct place', 3, NULL),              --27
  ('new place', 3, NULL);                  --28
