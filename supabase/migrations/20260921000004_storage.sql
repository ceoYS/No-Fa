-- NoF RC-17 — Future-Image storage (P3-A). A PRIVATE bucket; objects are namespaced by the owner's
-- anonymous user id (first path segment), so a user can only ever touch their own folder, and there is
-- no arbitrary bucket listing. Sharing to 영감 is done by SERVER-signed delivery (short-lived signed
-- URLs minted by an edge function), never by making the bucket public.

insert into storage.buckets (id, name, public)
values ('future-images', 'future-images', false)
on conflict (id) do nothing;

-- Own-folder access only: the object name must start with '<auth.uid()>/'. The generate-future-image
-- edge function writes with the service role (bypasses this), but these policies bound any direct
-- client access as defense-in-depth. No listing policy on the bucket root → no arbitrary enumeration.
create policy "future-images read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'future-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "future-images insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'future-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "future-images delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'future-images' and (storage.foldername(name))[1] = auth.uid()::text);
