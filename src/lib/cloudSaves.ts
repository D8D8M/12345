import { supabase } from './supabase';

export type CloudSave = {
  slot: number;
  saveData: unknown;
  updatedAt: string;
};

export async function loadCloudSaves(): Promise<CloudSave[]> {
  const { data, error } = await supabase
    .from('game_saves')
    .select('slot, save_data, updated_at')
    .order('slot');

  if (error) throw error;
  return (data ?? []).map((row) => ({
    slot: row.slot,
    saveData: row.save_data,
    updatedAt: row.updated_at,
  }));
}

export async function uploadCloudSave(userId: string, slot: number, saveData: unknown): Promise<void> {
  const { error } = await supabase.from('game_saves').upsert({
    user_id: userId,
    slot,
    save_data: saveData,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,slot' });

  if (error) throw error;
}

export function isCloudSaveDeletion(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'deleted' in value && value.deleted === true;
}

export async function deleteCloudSave(userId: string, slot: number): Promise<void> {
  const { error } = await supabase.from('game_saves').upsert({
    user_id: userId,
    slot,
    save_data: { deleted: true },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,slot' });
  if (error) throw error;
}
