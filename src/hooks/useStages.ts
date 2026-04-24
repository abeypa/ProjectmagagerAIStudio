import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Stage, StageType } from '../types';
import { toast } from 'react-hot-toast';

export function useStages(projectId: string) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch stages with computed stats
      // Note: Realistic stats would need separate queries or RPCs
      // For now we fetch stages and base stats if available
      const { data, error } = await supabase
        .from('stages')
        .select(`
          *,
          topics(progress_pct, status),
          issues(count),
          approvals(count),
          ideas(count),
          stage_files(count)
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Transform raw data into enriched Stage objects
      const enrichedStages = data.map((s: any) => {
        const topics = s.topics || [];
        const progress_pct = topics.length > 0 
          ? Math.round(topics.reduce((acc: number, t: any) => acc + (t.progress_pct || 0), 0) / topics.length)
          : 0;

        return {
          ...s,
          progress_pct,
          open_issue_count: s.issues?.[0]?.count || 0,
          pending_approvals_count: s.approvals?.[0]?.count || 0,
          finalized_idea_count: s.ideas?.[0]?.count || 0,
          file_count: s.stage_files?.[0]?.count || 0
        };
      });

      setStages(enrichedStages);
    } catch (error: any) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load project stages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchStages();
  }, [projectId, fetchStages]);

  return { stages, loading, refresh: fetchStages };
}
