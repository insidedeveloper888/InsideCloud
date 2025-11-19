# Contact Avatar Upload - Fix Guide

**Issue**: Avatar upload fails with "new row violates row-level security policy"

**Root Cause**:
- The `storage.objects` table needs RLS policies for authenticated users
- The original script tried to modify `storage.objects` table directly (requires owner privileges)
- Error "must be owner of table objects" when running SQL

**Solution**: Create a new bucket `contact-avatars` with proper RLS policies **via UI**

---

## Step 1: Create Bucket via Supabase Dashboard UI

**RECOMMENDED**: Use the UI instead of SQL to avoid permission errors

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **New bucket** button (green button at top right)
5. Configure the bucket:
   - **Name**: `contact-avatars`
   - **Public bucket**: ✅ **Toggle ON** (very important!)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: Add these (one per line):
     ```
     image/jpeg
     image/png
     image/gif
     image/webp
     image/svg+xml
     ```
6. Click **Create bucket**

You should now see `contact-avatars` in your bucket list.

---

## Step 2: Create RLS Policies via UI

1. Still in **Storage** section
2. Click on the `contact-avatars` bucket you just created
3. Click the **Policies** tab (top navigation)
4. Click **New policy** button

Create these 4 policies one by one:

### Policy 1: Public Read (SELECT)
Click **New policy** → Choose **Custom policy** → Fill in:
- **Policy name**: `Contact avatars are publicly accessible`
- **Allowed operation**: `SELECT` (check the box)
- **Target roles**: `public` (or leave as "For all users")
- **USING expression**:
  ```sql
  bucket_id = 'contact-avatars'
  ```
- Click **Review** → **Save policy**

### Policy 2: Authenticated Upload (INSERT)
Click **New policy** → Choose **Custom policy** → Fill in:
- **Policy name**: `Authenticated users can upload contact avatars`
- **Allowed operation**: `INSERT` (check the box)
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'contact-avatars'
  ```
- Click **Review** → **Save policy**

### Policy 3: Authenticated Update (UPDATE)
Click **New policy** → Choose **Custom policy** → Fill in:
- **Policy name**: `Authenticated users can update contact avatars`
- **Allowed operation**: `UPDATE` (check the box)
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'contact-avatars'
  ```
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'contact-avatars'
  ```
- Click **Review** → **Save policy**

### Policy 4: Authenticated Delete (DELETE)
Click **New policy** → Choose **Custom policy** → Fill in:
- **Policy name**: `Authenticated users can delete contact avatars`
- **Allowed operation**: `DELETE` (check the box)
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'contact-avatars'
  ```
- Click **Review** → **Save policy**

---

## Step 3: Verify Setup

After creating all 4 policies, you should see them listed in the **Policies** tab:

- ✅ Contact avatars are publicly accessible (SELECT)
- ✅ Authenticated users can upload contact avatars (INSERT)
- ✅ Authenticated users can update contact avatars (UPDATE)
- ✅ Authenticated users can delete contact avatars (DELETE)

**Optional**: Verify via SQL Editor:
```sql
-- Check bucket
SELECT * FROM storage.buckets WHERE id = 'contact-avatars';

-- Check policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%contact avatar%';
```

---

## Step 4: Test Avatar Upload

1. Restart your React dev server:
   ```bash
   npm run start
   ```

2. Navigate to Contact Management
3. Click **Add Contact** or edit an existing contact
4. Try uploading an avatar image

**Expected Behavior**:
- ✅ Image uploads successfully
- ✅ Preview shows immediately
- ✅ Public URL is generated
- ✅ Avatar is saved to database

---

## Troubleshooting

### Error: "must be owner of table objects"
**Cause**: SQL scripts cannot modify RLS policies on storage.objects (requires superuser)
**Fix**: Use the **UI method** described above instead of SQL
- Create bucket via Storage UI
- Create policies via Policies tab in Storage UI

### Error: "new row violates row-level security policy"
**Possible Causes**:
1. **User not authenticated**
   - Check that you're logged in to the app
   - Verify JWT token exists in browser cookies

2. **RLS policies not created**
   - Verify policies exist (Step 3)
   - Ensure policies use `TO authenticated` role

3. **Wrong bucket name**
   - Code should use `contact-avatars` bucket (already updated)
   - Old code used `avatars` bucket (different policies)

4. **Anon key not set**
   - Check `.env` file has `REACT_APP_SUPABASE_ANON_KEY`
   - Restart React dev server after changing .env

### Error: "Bucket not found"
**Cause**: Bucket `contact-avatars` doesn't exist
**Fix**: Run Step 1 again

### Error: "File too large"
**Cause**: File size exceeds 5MB limit
**Fix**: Resize image or use smaller file

---

## Code Changes Made

### Updated Files:
1. ✅ `src/tools/contact-management/components/ContactFormDialog.jsx`
   - Changed bucket from `avatars` to `contact-avatars`
   - Lines 211 and 226

### New Files:
1. ✅ `docs/contact-management-avatar-storage-setup-v2.sql`
   - Creates `contact-avatars` bucket
   - Sets up RLS policies for authenticated users

---

## Next Steps After Fix

Once avatar upload is working:

1. **Test different file types**: JPG, PNG, GIF, WebP, SVG
2. **Test file size limits**: Try uploading 6MB file (should fail)
3. **Test update flow**: Upload, then replace with new avatar
4. **Test delete flow**: Remove avatar and upload new one
5. **Verify public URLs**: Check that URLs are accessible without auth

---

## Technical Details

### Bucket Configuration
- **Name**: `contact-avatars`
- **Public**: Yes (anyone can read)
- **Max file size**: 5MB (5,242,880 bytes)
- **Allowed MIME types**:
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `image/svg+xml`

### File Naming Convention
```
{organization_slug}/{timestamp}-{random}.{extension}
```

**Example**:
```
cloud/1700000000000-abc123.jpg
```

### Public URL Format
```
https://rituzypqhjawhyrxoddj.supabase.co/storage/v1/object/public/contact-avatars/{file_path}
```

**Example**:
```
https://rituzypqhjawhyrxoddj.supabase.co/storage/v1/object/public/contact-avatars/cloud/1700000000000-abc123.jpg
```

---

## Security Considerations

### Current Setup (Development)
- ✅ Any authenticated user can upload avatars
- ✅ All avatars are publicly readable (no auth required)
- ✅ File size limited to 5MB
- ✅ Only image MIME types allowed

### Production Recommendations
1. **Restrict uploads by organization**
   - Only allow users to upload to their own organization folder
   - Add organization check in RLS policy

2. **Add virus scanning**
   - Use Supabase Edge Functions to scan uploads
   - Reject files with malware

3. **Add rate limiting**
   - Prevent users from uploading too many files
   - Use Supabase Rate Limiting or custom implementation

4. **Monitor storage usage**
   - Set up alerts for storage quota
   - Implement cleanup for orphaned files

5. **Consider private avatars**
   - If avatars should be private, set `public = false`
   - Use `createSignedUrl()` for temporary access

---

## FAQ

**Q: Can I use the old `avatars` bucket?**
A: No, the old bucket likely has different RLS policies. Use `contact-avatars` to avoid conflicts.

**Q: Can I delete the old SQL script?**
A: Yes, you can delete `docs/contact-management-avatar-storage-setup.sql`. Use the new v2 script.

**Q: What happens to existing avatars?**
A: Existing avatars with URLs pointing to the old bucket will still work. New uploads will use `contact-avatars`.

**Q: Can I migrate old avatars to the new bucket?**
A: Yes, but it requires manual work. You can write a script to copy files and update URLs in the database.

**Q: Do I need to restart the server after creating the bucket?**
A: No, the bucket is created on Supabase side. Your app will use it immediately.

---

## Summary

✅ **What was changed**:
- Created new bucket: `contact-avatars`
- Added RLS policies for authenticated users
- Updated code to use new bucket

✅ **What you need to do**:
1. Run SQL script in Supabase Dashboard
2. Verify bucket and policies
3. Test avatar upload

✅ **Expected result**:
- Avatar uploads work without RLS errors
- Public URLs are generated correctly
- Images are accessible via URL
