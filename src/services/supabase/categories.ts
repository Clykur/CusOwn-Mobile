import { supabase } from '@/lib/supabase';
import { BusinessCategory } from '@/types/business.types';
import { logger, LogTag } from '@/utils/logger';
import { mapCategoryRow } from './mappers';

export async function listBusinessCategories(): Promise<BusinessCategory[]> {
  let { data, error } = await supabase.from('business_categories').select('*').order('name');

  if (error) {
    logger.warn(LogTag.API, 'listBusinessCategories retry minimal columns', error);
    ({ data, error } = await supabase
      .from('business_categories')
      .select('id, name, slug, icon_name')
      .order('name'));
  }

  if (error) {
    logger.error(LogTag.API, 'listBusinessCategories failed', error);
    throw error;
  }

  return (data || []).map((row) => mapCategoryRow(row as Record<string, unknown>));
}
