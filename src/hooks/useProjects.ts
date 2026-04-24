import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectStatus, StageType } from '../types';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch projects where user is a member
      const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', profile?.id);

      if (memberError) throw memberError;

      const projectIds = memberProjects.map(m => m.project_id);

      if (projectIds.length === 0 && !profile?.is_admin) {
        setProjects([]);
        return;
      }

      let query = supabase
        .from('projects')
        .select(`
          *,
          owner:profiles!projects_owner_id_fkey(*),
          members_count:project_members(count),
          stages(*)
        `)
        .order('created_at', { ascending: false });

      if (!profile?.is_admin) {
        query = query.in('id', projectIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const flattenedProjects = (data || []).map((p: any) => ({
        ...p,
        members_count: p.members_count?.[0]?.count || 0
      }));

      setProjects(flattenedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const createProject = async (projectData: Partial<Project>) => {
    try {
      // Get the fresh user ID from the session to ensure it matches auth.uid() in RLS
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated. Please log in to create a project.');
      }

      // Convert empty strings to null for optional database fields
      const formattedData = {
        ...projectData,
        owner_id: user.id,
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
      };

      // 1. Create Project
      const { data: project, error: pError } = await supabase
        .from('projects')
        .insert([formattedData])
        .select()
        .single();

      if (pError) throw pError;

      // 2. Add Owner as Project Member
      const { error: mError } = await supabase
        .from('project_members')
        .insert([{
          project_id: project.id,
          user_id: profile?.id,
          role: 'owner'
        }]);

      if (mError) throw mError;

      // 3. Auto-insert 5 Stages
      const stages: { project_id: string; stage_type: StageType; order_index: number }[] = [
        { project_id: project.id, stage_type: '3d_design', order_index: 1 },
        { project_id: project.id, stage_type: 'electrical_design', order_index: 2 },
        { project_id: project.id, stage_type: 'software', order_index: 3 },
        { project_id: project.id, stage_type: 'purchase', order_index: 4 },
        { project_id: project.id, stage_type: 'manufacturing', order_index: 5 }
      ];

      const { error: sError } = await supabase
        .from('stages')
        .insert(stages);

      if (sError) throw sError;

      // 4. Log activity
      await supabase.from('activity_log').insert([{
        project_id: project.id,
        actor_id: profile?.id,
        action: 'created_project',
        entity_type: 'project',
        entity_id: project.id
      }]);

      toast.success('Project created successfully!');
      fetchProjects();
      return project;
    } catch (error: any) {
      console.error('Error creating project:', error);
      const errorMessage = error.message || 'Failed to create project';
      const errorDetails = error.details ? ` (${error.details})` : '';
      toast.error(`${errorMessage}${errorDetails}`);
      throw error;
    }
  };

  useEffect(() => {
    if (profile) fetchProjects();
  }, [profile, fetchProjects]);

  return { projects, loading, createProject, refresh: fetchProjects };
}
