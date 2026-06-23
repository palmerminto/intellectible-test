-- Allow server-side Supabase clients using the service role key to manage app data.
grant usage on schema public to service_role;

grant all privileges on table documents to service_role;
grant all privileges on table chunks to service_role;
grant all privileges on table drafts to service_role;
grant all privileges on table draft_items to service_role;

grant execute on all functions in schema public to service_role;
