drop table if exists locations;

create table locations (
  "id" serial primary key,
  "search_query" varchar(255),
  "formatted_query" varchar(255),
  "latitude" varchar(255),
  "longitude" varchar(255)
);

-- function Location(searchQuery, object) {
--   this.search_query = searchQuery;
--   this.formatted_query = object.display_name;
--   this.latitude = object.lat;
--   this.longitude = object.lon;
-- }

drop table if exists weather;

create table weather (
  "id" serial primary key,
  "search_query" varchar(255),
  "forecast" varchar(255),
  "time" varchar(255)
);


drop table if exists trails_or_campgrounds;

create table trails_or_campgrounds (
  "id" serial primary key,
  "search_query" varchar(255),
  "name" varchar(255),
  "location" varchar(255),
  "length" varchar(255),
  "stars" varchar(255),
  "star_votes" varchar(255),
  "summary" varchar(255),
  "trail_url" varchar(255),
  "conditions" varchar(255),
  "condition_date" varchar(255),
  "condition_time" varchar(255)
)

  -- this.search_query = searchQuery;
  -- this.name = object.name;
  -- this.location = object.location;
  -- this.length = object.length;
  -- this.stars = object.stars;
  -- this.star_votes = object.starVotes;
  -- this.summary = object.summary;
  -- this.trail_url = object.url;
  -- this.conditions = object.conditionDetails;
  -- //assuming that the conditionDate property is a string of the format
  -- //'YYYY-MM-DD HH-MM-SS'
  -- this.condition_date = object.conditionDate.split(' ')[0];
  -- this.condition_time = object.conditionDate.split(' ')[1];