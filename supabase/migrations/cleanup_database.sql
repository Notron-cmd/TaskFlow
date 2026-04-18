-- =====================================================
-- DEBUG: Cek Status Database
-- =====================================================

-- 1. Berapa auth users?
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 2. Berapa profiles?
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 3. Berapa workspaces?
SELECT COUNT(*) as total_workspaces FROM public.workspaces;

-- 4. Berapa workspace_members?
SELECT COUNT(*) as total_workspace_members FROM public.workspace_members;

-- 5. Lihat semua user + profile + workspace
SELECT 
  p.id,
  p.email,
  p.full_name,
  COUNT(w.id) as workspace_count,
  COUNT(wm.workspace_id) as membership_count
FROM public.profiles p
LEFT JOIN public.workspaces w ON w.owner_id = p.id
LEFT JOIN public.workspace_members wm ON wm.user_id = p.id
GROUP BY p.id, p.email, p.full_name;

-- =====================================================
-- CLEANUP: Hapus semua data dan setup ulang
-- =====================================================

-- 1. BACKUP: Lihat data yang ada
SELECT * FROM public.workspace_members;
SELECT * FROM public.workspaces;
SELECT * FROM public.profiles;

-- 2. CLEANUP: Hapus duplikat/orphaned data
-- Hapus workspace_members yang orphaned
DELETE FROM public.workspace_members 
WHERE workspace_id NOT IN (SELECT id FROM public.workspaces);

-- Hapus workspace yang orphaned
DELETE FROM public.workspaces 
WHERE owner_id NOT IN (SELECT id FROM public.profiles);

-- Hapus profile yang orphaned
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. SETUP BARU: Untuk setiap profile yang belum punya workspace
INSERT INTO public.workspaces (name, slug, owner_id)
SELECT 
  'My Workspace',
  'workspace-' || p.id::text,
  p.id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspaces w 
  WHERE w.owner_id = p.id
)
ON CONFLICT (slug) DO NOTHING;

-- 4. SETUP BARU: Tambahkan ke workspace_members
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'owner'
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = w.id 
  AND wm.user_id = w.owner_id
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- =====================================================
-- VERIFY: Cek hasil setelah cleanup
-- =====================================================

SELECT 
  w.id as workspace_id,
  w.name,
  w.slug,
  p.email,
  wm.role,
  wm.joined_at
FROM public.workspaces w
JOIN public.profiles p ON w.owner_id = p.id
LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id
ORDER BY w.created_at DESC;
