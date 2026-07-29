-- Enable RLS on all Django tables and add permissive policies for the postgres role
-- Run this in Supabase SQL Editor

-- Enable RLS on all public tables
ALTER TABLE public.users_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_user_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.django_content_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.django_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.django_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.django_admin_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academics_grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academics_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academics_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academics_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_airun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessonplans_lessonplan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets_widget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages_pageblock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages_menuitem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages_pagetemplate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages_sitesettings ENABLE ROW LEVEL SECURITY;

-- Allow full access to the postgres role (Django's DB user)
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename LIKE 'django_%' OR tablename LIKE 'auth_%' OR tablename LIKE 'users_%'
    OR tablename LIKE 'academics_%' OR tablename LIKE 'ai_%' OR tablename LIKE 'lessonplans_%'
    OR tablename LIKE 'themes_%' OR tablename LIKE 'widgets_%' OR tablename LIKE 'pages_%'
  LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "Allow postgres full access" ON public.%I FOR ALL TO postgres USING (true) WITH CHECK (true)', tbl.tablename);
  END LOOP;
END $$;

-- Also allow anon role read access to public-facing tables (for frontend)
CREATE POLICY IF NOT EXISTS "Allow anon read pages" ON public.pages_page FOR SELECT TO anon USING (is_published = true);
CREATE POLICY IF NOT EXISTS "Allow anon read blocks" ON public.pages_pageblock FOR SELECT TO anon USING (is_active = true);
CREATE POLICY IF NOT EXISTS "Allow anon read menu" ON public.pages_menuitem FOR SELECT TO anon USING (is_active = true);
CREATE POLICY IF NOT EXISTS "Allow anon read themes" ON public.themes_theme FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon read settings" ON public.pages_sitesettings FOR SELECT TO anon USING (true);
