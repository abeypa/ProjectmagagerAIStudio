import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Topic, TopicStatus } from '../types';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

export function useTopics(stageId: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          assignees:profiles(*),
          issues_count:issues(count)
        `)
        .eq('stage_id', stageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Compute approval status briefly (simplified)
      const topicsWithStatus = data.map((t: any) => ({
        ...t,
        issues_count: t.issues_count?.[0]?.count || 0
      }));

      setTopics(topicsWithStatus);
    } catch (error: any) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, [stageId]);

  const addTopic = async (topicData: Partial<Topic>, assigneeIds: string[] = []) => {
    try {
      const { data: topic, error } = await supabase
        .from('topics')
        .insert([{
          ...topicData,
          stage_id: stageId,
          created_by: profile?.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (assigneeIds.length > 0) {
        const { error: aError } = await supabase
          .from('topic_assignees')
          .insert(assigneeIds.map(uid => ({
            topic_id: topic.id,
            user_id: uid
          })));
        if (aError) throw aError;
      }

      toast.success('Topic added');
      fetchTopics();
      return topic;
    } catch (error: any) {
      toast.error('Failed to add topic');
      throw error;
    }
  };

  const updateTopic = async (topicId: string, updates: Partial<Topic>) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', topicId);

      if (error) throw error;
      fetchTopics();
    } catch (error: any) {
      toast.error('Update failed');
    }
  };

  useEffect(() => {
    if (stageId) fetchTopics();
  }, [stageId, fetchTopics]);

  return { topics, loading, addTopic, updateTopic, refresh: fetchTopics };
}
