# 02 — Profile & Settings

**Status:** Live  
**Route:** `/dashboard/profile`

## Overview

User profile management with avatar upload, display name, country, and timezone. Avatar images are uploaded via UploadThing (CDN-hosted), compressed client-side to 256px WebP before upload. Profile changes are saved via server actions.

## How it works

1. User navigates to Profile from the sidebar
2. Avatar section: upload, replace, or remove a photo (PNG/JPG/WebP, 2MB max)
3. Client compresses image to 256px max dimension, WebP at 0.8 quality before upload
4. UploadThing stores the file, returns a CDN URL saved to the `avatar` field in MongoDB
5. Replacing or removing an avatar deletes the old file from UploadThing
6. Personal details: edit name (email is read-only with "Verified" badge)
7. Location: country dropdown populates timezone dropdown
8. "Save changes" button is disabled until a field is dirty
9. "Discard" reverts to the last saved values

## Key files

- `src/app/dashboard/profile/profile-form.tsx` — Full profile form component
- `src/app/dashboard/profile/page.tsx` — Server page, fetches user data
- `src/actions/user.ts` — `updateProfile`, `removeAvatar` server actions
- `src/lib/uploadthing.ts` — `useUploadThing` typed hook
- `src/lib/compress-image.ts` — Canvas-based client-side compression
- `src/app/api/uploadthing/core.ts` — File router with `avatar` endpoint
- `src/lib/countries.ts` — Country list with timezone mappings

## Implementation details

- Avatar upload: UploadThing free tier (2GB storage), auth-gated via session
- Compression: Canvas API resizes to 256px max dimension, re-encodes as WebP at 0.8 quality
- Old avatar cleanup: on replace/remove, old file key extracted from URL and deleted via `UTApi.deleteFiles()`
- Dirty state tracking: Save button enabled only when name, country, or timezone differs from server values
- Avatar changes are independent of profile save (handled by UploadThing's `onUploadComplete`)

## Test cases

### Avatar upload
- [ ] Upload a PNG/JPG/WebP image → preview updates, avatar shown in sidebar
- [ ] Upload a large image (e.g. 1MB JPEG) → compressed to ~small WebP, upload succeeds
- [ ] Upload button shows "Uploading..." during upload, disabled state
- [ ] After upload, "Replace" and "Remove" buttons appear

### Avatar replace / remove
- [ ] Click "Replace" → upload a new image → old avatar deleted from UploadThing, new one shown
- [ ] Click "Remove" → avatar cleared, initials shown instead
- [ ] After remove, UploadThing no longer hosts the old file

### Avatar validation
- [ ] Upload a non-image file (e.g. PDF) → "Please upload a PNG, JPG, or WebP image." error
- [ ] Upload an image > 2MB → "Image must be under 2 MB." error
- [ ] Upload while another upload is in progress → button is disabled

### Profile editing
- [ ] Change name → "Save changes" button becomes enabled
- [ ] Change country → timezone dropdown updates, Save becomes enabled
- [ ] Change timezone → Save becomes enabled
- [ ] No changes made → Save button is disabled
- [ ] Click "Discard" → all fields revert to saved values

### Profile save
- [ ] Save with valid data → "Saved" confirmation appears for 3 seconds
- [ ] Save with empty name → "Name is required." error shown
- [ ] Email field is read-only — cannot be edited
- [ ] "Verified" badge shown next to email if `emailVerified` is set

### Profile display
- [ ] Avatar shows in sidebar and profile page consistently
- [ ] If no avatar, initials derived from name (or email prefix) are shown
- [ ] Initials are max 2 characters, uppercase
