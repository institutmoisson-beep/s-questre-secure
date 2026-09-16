-- product photos: any authenticated user uploads into their own folder, all authenticated can read
create policy "product photos: upload own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "product photos: read authenticated"
on storage.objects for select to authenticated
using (bucket_id = 'product-photos');

create policy "product photos: delete own"
on storage.objects for delete to authenticated
using (bucket_id = 'product-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- KYC documents: strictly owner + admin
create policy "kyc: upload own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "kyc: read own or admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'kyc-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin'))
);