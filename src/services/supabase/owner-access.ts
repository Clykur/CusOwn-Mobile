import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';

/**
 * Resolve business ids owned by a user (supports owner_user_id or legacy owner_id on businesses).
 */
export async function listOwnedBusinessIds(ownerUserId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_user_id', ownerUserId)
    .is('deleted_at', null);

  if (error) {
    logger.error(LogTag.API, 'listOwnedBusinessIds failed', error);
    throw error;
  }

  return (data || []).map((r) => r.id as string);
}

export async function assertBusinessOwnedByUser(
  businessId: string,
  ownerUserId: string,
): Promise<void> {
  const ids = await listOwnedBusinessIds(ownerUserId);
  if (!ids.includes(businessId)) {
    throw new Error('Business not found or not owned by current user');
  }
}
