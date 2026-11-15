/* NOVACARE — database configuration.
   SHIP_SERVER_URL: the ship server on the ship's own network (ship/server.js, started by
     docker-compose.yml). When set, accounts, missions, crew status, emergency alerts and the
     shared inventory go there and need no internet; Supabase is not used. The docker setup
     serves ship/config.js in place of this file, so the public website keeps using Supabase.
   SUPABASE_*: the cloud database (Project Settings → API), used when SHIP_SERVER_URL is empty.
   With neither set, NOVACARE runs in local-only mode: data stays in this browser. */

const NOVACARE_CONFIG = {
  SHIP_SERVER_URL: '',
  SUPABASE_URL: 'https://lstvevxgqnhgwkeiqhye.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_DYr6i6P6SmOyH5mZon4lOg_afbKxNas',
};
