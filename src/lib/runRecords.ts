import type { RunMode } from '../game/runModes';
import { supabase } from './supabase';

export type RunRecord = {
  id: string;
  player_name: string;
  mode: RunMode;
  completion_seconds: number;
  kills: number;
  bosses_defeated: number;
  daily_streak: number;
  completed_at: string;
};

export type NewRunRecord = Omit<RunRecord, 'id' | 'completed_at'>;

export async function saveRunRecord(record: NewRunRecord): Promise<void> {
  const { error } = await supabase.from('run_records').insert(record);
  if (error) throw error;
}

export async function loadRunRecords(): Promise<RunRecord[]> {
  const { data, error } = await supabase
    .from('run_records')
    .select('id, player_name, mode, completion_seconds, kills, bosses_defeated, daily_streak, completed_at')
    .order('completion_seconds', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data as RunRecord[];
}

