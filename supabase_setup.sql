-- COMPREHENSIVE SUPABASE SETUP SCRIPT
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    department TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HELPER FUNCTIONS (SECURITY DEFINER) to break RLS recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_project_access(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if owner
    IF EXISTS (SELECT 1 FROM public.projects WHERE id = p_id AND owner_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;
    -- Check if member
    IF EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p_id AND user_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;
    -- Check if admin
    IF public.check_is_admin() THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
    start_date DATE,
    end_date DATE,
    customer TEXT,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view projects" ON public.projects;
CREATE POLICY "Users can view projects" ON public.projects
    FOR SELECT TO authenticated USING (
        public.check_project_access(id)
    );

DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
CREATE POLICY "Owners can update projects" ON public.projects
    FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
CREATE POLICY "Owners can delete projects" ON public.projects
    FOR DELETE USING (owner_id = auth.uid());

-- 3. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'contributor',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View members" ON public.project_members;
CREATE POLICY "View members" ON public.project_members
    FOR SELECT TO authenticated USING (
        public.check_project_access(project_id)
    );

DROP POLICY IF EXISTS "Insert members" ON public.project_members;
CREATE POLICY "Insert members" ON public.project_members
    FOR INSERT WITH CHECK (
        public.check_project_access(project_id)
    );

DROP POLICY IF EXISTS "Update members" ON public.project_members;
CREATE POLICY "Update members" ON public.project_members
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Delete members" ON public.project_members;
CREATE POLICY "Delete members" ON public.project_members
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()) OR
        user_id = auth.uid()
    );

-- 4. Stages Table
CREATE TABLE IF NOT EXISTS public.stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_type TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert stages" ON public.stages;
CREATE POLICY "Insert stages" ON public.stages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "View stages" ON public.stages;
CREATE POLICY "View stages" ON public.stages
    FOR SELECT USING (
        public.check_project_access(project_id)
    );

-- 5. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES public.stages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started',
    progress_pct INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All on topics" ON public.topics;
CREATE POLICY "All on topics" ON public.topics
    FOR ALL USING (
        public.check_project_access((SELECT project_id FROM public.stages WHERE id = topics.stage_id))
    );

-- 6. Ideas, 7. Approvals, 8. Issues, 9. Stage Files
-- Using helper to ensure members can access
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ideas access" ON public.ideas;
CREATE POLICY "Ideas access" ON public.ideas 
    FOR ALL USING (
        public.check_project_access((SELECT project_id FROM public.stages s JOIN public.topics t ON t.stage_id = s.id WHERE t.id = ideas.topic_id))
    );

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approvals access" ON public.approvals;
CREATE POLICY "Approvals access" ON public.approvals 
    FOR ALL USING (
        public.check_project_access((SELECT project_id FROM public.stages s JOIN public.topics t ON t.stage_id = s.id WHERE t.id = approvals.topic_id))
    );

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Issues access" ON public.issues;
CREATE POLICY "Issues access" ON public.issues 
    FOR ALL USING (
        public.check_project_access((SELECT project_id FROM public.stages s JOIN public.topics t ON t.stage_id = s.id WHERE t.id = issues.topic_id))
    );

ALTER TABLE public.stage_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Files access" ON public.stage_files;
CREATE POLICY "Files access" ON public.stage_files 
    FOR ALL USING (
        public.check_project_access(project_id)
    );

-- 10. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert activity" ON public.activity_log;
CREATE POLICY "Insert activity" ON public.activity_log
    FOR INSERT WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "View activity" ON public.activity_log;
CREATE POLICY "View activity" ON public.activity_log
    FOR SELECT USING (
        public.check_project_access(project_id)
    );

-- Enable Trigger for user creation (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
