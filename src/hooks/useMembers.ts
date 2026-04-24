import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectMember, MemberRole } from '../types';
import { toast } from 'react-hot-toast';

export function useMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profile:profiles(*)')
        .eq('project_id', projectId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load project members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addMember = async (email: string, role: MemberRole = 'contributor') => {
    try {
      // 1. Find user by email
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          throw new Error('User not found. They must sign in once to create a profile.');
        }
        throw profileError;
      }

      // 2. Add to project_members
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_id: userProfile.id,
          role
        }]);

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('User is already a member of this project');
        }
        throw memberError;
      }

      toast.success('Member added successfully');
      fetchMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Member removed');
      fetchMembers();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const updateMemberRole = async (memberId: string, role: MemberRole) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Role updated');
      fetchMembers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, addMember, removeMember, updateMemberRole, refresh: fetchMembers };
}
