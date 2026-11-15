/* NOVACARE — ship configuration (served as js/config.js by docker-compose.yml).
   Crew accounts, missions, crew status, emergency alerts and the ship inventory go to the
   ship server on the ship's own network: no internet and no Supabase needed.
   'ship/' is relative to the page, so it works at whatever address the ship terminal has. */

const NOVACARE_CONFIG = {
  SHIP_SERVER_URL: 'ship/',
  // Earth link (optional, not used while SHIP_SERVER_URL is set): see README → "Ship server".
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
