import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';

import type { BusinessCategory } from '@/types/business.types';

export async function listBusinessCategories(): Promise<BusinessCategory[]> {
  const { data, error } = await supabase
    .from('business_categories')
    .select('value, label')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    logger.error(LogTag.API, 'listBusinessCategories failed', error);
    return [];
  }

  return (data || []).map((row) => ({
    value: row.value,
    label: row.label,
  }));
}
