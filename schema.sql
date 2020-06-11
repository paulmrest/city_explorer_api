drop table if exists locations;

create table locations (
  "id" SERIAL PRIMARY KEY,
  "search_query" VARCHAR(255),
  "display_name" VARCHAR(255),
  "lat" DECIMAL(12, 9),
  "lon" DECIMAL(12, 9)
);