CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


create policy "Allow authenticated users to upload print design images"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'print_designs'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Public Access to Print Design Images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'print_designs'::text));



