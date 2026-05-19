import { supabase } from '@/lib/supabase';
import { BusinessCategory } from '@/types/business.types';
import { logger, LogTag } from '@/utils/logger';
import { mapCategoryRow } from './mappers';

export async function listBusinessCategories(): Promise<BusinessCategory[]> {
  // Supabase schema may drift between app versions.
  // Make this query tolerant: never fail the whole screen just because one column name changed.

  // 1) Try the most complete/expected shape.
  let { data, error } = await supabase
    .from('business_categories')
    .select('id, name, slug, icon_name');

  // 2) If columns don't exist, fall back to whatever we can fetch.
  if (error) {
    logger.warn(LogTag.API, 'listBusinessCategories retry minimal columns', error);

    ({ data, error } = await supabase
      .from('business_categories')
      .select('id, slug, icon_name, name'));
  }

  // 3) Last resort: select * (no strict ordering).
  if (error) {
    logger.warn(LogTag.API, 'listBusinessCategories fallback to select *', error);
    ({ data, error } = await supabase.from('business_categories').select('*'));
  }

  if (error) {
    logger.error(LogTag.API, 'listBusinessCategories failed', error);
    // Return empty list so the UI can keep working.
    return [];
  }

  return (data || []).map((row) => mapCategoryRow(row as Record<string, unknown>));
}
