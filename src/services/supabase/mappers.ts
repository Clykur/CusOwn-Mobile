import { supabase } from '@/lib/supabase';
import { Booking } from '@/types/booking.types';
import { Business, BusinessCategory, Service } from '@/types/business.types';
import { logger, LogTag } from '@/utils/logger';

export function mapCategoryRow(row: Record<string, unknown>): BusinessCategory {
  const id = row.id != null ? String(row.id) : undefined;
  const slug = row.slug != null ? String(row.slug) : undefined;
  return {
    id,
    value: slug || id || '',
    label: String(row.name ?? row.label ?? ''),
    icon:
      row.icon_name != null
        ? String(row.icon_name)
        : row.icon != null
          ? String(row.icon)
          : undefined,
  };
}

function mapCategoryFields(row: Record<string, unknown>): {
  category?: string;
  category_id?: string;
} {
  const raw = row.category;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const c = raw as Record<string, unknown>;
    return {
      category_id:
        row.category_id != null ? String(row.category_id) : c.id != null ? String(c.id) : undefined,
      category: c.slug != null ? String(c.slug) : c.name != null ? String(c.name) : undefined,
    };
  }
  return {
    category_id: row.category_id != null ? String(row.category_id) : undefined,
    category: raw != null ? String(raw) : undefined,
  };
}

export function mapServiceRow(s: Record<string, unknown>): Service {
  const priceCents = s.price_cents as number | null | undefined;
  const price =
    priceCents !== undefined && priceCents !== null
      ? Number(priceCents) / 100
      : s.price !== undefined && s.price !== null
        ? Number(s.price)
        : 0;
  const duration =
    s.duration_minutes !== undefined && s.duration_minutes !== null
      ? Number(s.duration_minutes)
      : s.duration !== undefined && s.duration !== null
        ? Number(s.duration)
        : 30;

  return {
    ...(s as object),
    id: String(s.id),
    business_id: String(s.business_id ?? ''),
    name: String(s.name ?? ''),
    description: s.description != null ? String(s.description) : undefined,
    duration,
    price,
  } as Service;
}

export function mapBusinessRow(row: Record<string, unknown>): Business {
  const servicesRaw = row.services;
  const services = Array.isArray(servicesRaw)
    ? servicesRaw.map((s) => mapServiceRow(s as Record<string, unknown>))
    : undefined;

  const categoryFields = mapCategoryFields(row);
  const id = row.id != null ? String(row.id) : '';

  return {
    ...(row as object),
    id,
    owner_user_id: String(row.owner_user_id ?? row.owner_id ?? ''),
    salon_name: String(row.salon_name ?? row.name ?? ''),
    owner_name: String(row.owner_name ?? ''),
    whatsapp_number: String(row.whatsapp_number ?? ''),
    opening_time: String(row.opening_time ?? ''),
    closing_time: String(row.closing_time ?? ''),
    slot_duration: Number(row.slot_duration ?? 30),
    booking_link: String(row.booking_link ?? ''),
    address: String(row.address ?? row.location ?? ''),
    location: row.location != null ? String(row.location) : undefined,
    city: row.city != null ? String(row.city) : undefined,
    ...categoryFields,
    image_url: row.image_url != null ? String(row.image_url) : undefined,
    cover_photo_url:
      row.cover_photo_url != null
        ? String(row.cover_photo_url)
        : row.image_url != null
          ? String(row.image_url)
          : undefined,
    rating_avg: Number(row.rating_avg ?? row.rating ?? 0),
    review_count: Number(row.review_count ?? row.reviews_count ?? 0),
    created_at: (row.created_at as string | number | Date) ?? new Date().toISOString(),
    services,
  } as Business;
}

/**
 * Resolves booking price robustly by summing all services or falling back to top-level price fields
 */
export function getBookingPrice(b: unknown): number {
  if (!b || typeof b !== 'object') return 0;
  const booking = b as Record<string, unknown>;

  const totalFromCents =
    booking.total_price_cents !== undefined && booking.total_price_cents !== null
      ? Number(booking.total_price_cents) / 100
      : undefined;

  let rawServices = booking.services;

  if (Array.isArray(rawServices)) {
    rawServices = rawServices.map((bs: Record<string, unknown>) => {
      if (bs.service && typeof bs.service === 'object') {
        const svc = bs.service as Record<string, unknown>;
        return {
          ...svc,
          price_cents:
            bs.price_cents !== undefined && bs.price_cents !== null
              ? bs.price_cents
              : svc.price_cents,
        };
      }
      return bs;
    });
  } else if (!rawServices && Array.isArray(booking.booking_services)) {
    rawServices = (booking.booking_services as Record<string, unknown>[])
      .map((bs) => {
        if (bs.service && typeof bs.service === 'object') {
          const svc = bs.service as Record<string, unknown>;
          return {
            ...svc,
            price_cents:
              bs.price_cents !== undefined && bs.price_cents !== null
                ? bs.price_cents
                : svc.price_cents,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  const services = (rawServices as Record<string, unknown>[]) || [];
  const servicesSum =
    Array.isArray(services) && services.length > 0
      ? services.reduce((sum: number, s: Record<string, unknown>) => {
          const price =
            s?.price_cents !== undefined && s?.price_cents !== null
              ? Number(s.price_cents) / 100
              : Number(s?.price || 0);
          return sum + price;
        }, 0)
      : 0;

  const serviceObj = booking.service as Record<string, unknown> | undefined;
  const servicePrice = serviceObj
    ? serviceObj.price_cents !== undefined && serviceObj.price_cents !== null
      ? Number(serviceObj.price_cents) / 100
      : Number(serviceObj.price || 0)
    : 0;

  const priceCents =
    booking.price_cents !== undefined && booking.price_cents !== null
      ? Number(booking.price_cents) / 100
      : 0;

  const candidates = [
    totalFromCents,
    servicesSum,
    servicePrice,
    priceCents,
    Number(booking.total_price || 0),
    Number(booking.totalPrice || 0),
    Number(booking.price || 0),
  ].filter((v) => typeof v === 'number' && !isNaN(v)) as number[];

  let resolvedPrice = 0;
  if (totalFromCents !== undefined && totalFromCents > 0) {
    resolvedPrice = totalFromCents;
  } else if (servicesSum > 0) {
    resolvedPrice = servicesSum;
  } else {
    for (const candidate of candidates) {
      if (candidate > 0) {
        resolvedPrice = candidate;
        break;
      }
    }
  }
  return resolvedPrice;
}

export function mapBooking(b: Record<string, unknown>): Booking {
  let rawServices = b.services;

  if (Array.isArray(rawServices)) {
    rawServices = rawServices.map((bs: Record<string, unknown>) => {
      if (bs.service && typeof bs.service === 'object') {
        const svc = bs.service as Record<string, unknown>;
        return {
          ...svc,
          price_cents:
            bs.price_cents !== undefined && bs.price_cents !== null
              ? bs.price_cents
              : svc.price_cents,
        };
      }
      return bs;
    });
  } else if (!rawServices && Array.isArray(b.booking_services)) {
    rawServices = (b.booking_services as Record<string, unknown>[])
      .map((bs) => {
        if (bs.service && typeof bs.service === 'object') {
          const svc = bs.service as Record<string, unknown>;
          return {
            ...svc,
            price_cents:
              bs.price_cents !== undefined && bs.price_cents !== null
                ? bs.price_cents
                : svc.price_cents,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  const mappedServices = Array.isArray(rawServices)
    ? rawServices.map((s: Record<string, unknown>) => {
        const sPrice =
          s.price_cents !== undefined && s.price_cents !== null
            ? Number(s.price_cents) / 100
            : s.price !== undefined && s.price !== null
              ? Number(s.price)
              : 0;
        return { ...s, price: sPrice };
      })
    : undefined;

  const price = getBookingPrice(b);

  let serviceName = 'Standard Service';
  if (typeof b.service_name === 'string') {
    serviceName = b.service_name;
  } else if (Array.isArray(b.service_name) && b.service_name.length > 0) {
    const first = b.service_name[0] as Record<string, unknown>;
    serviceName = String(first?.name ?? first?.service_name ?? 'Standard Service');
  } else if (typeof b.service_name === 'object' && b.service_name !== null) {
    const sn = b.service_name as Record<string, unknown>;
    if (sn.name) serviceName = String(sn.name);
  } else if (mappedServices && mappedServices.length > 0) {
    serviceName = String((mappedServices[0] as Record<string, unknown>).name ?? 'Standard Service');
  } else if (b.service && typeof b.service === 'object') {
    const svc = b.service as Record<string, unknown>;
    serviceName = String(svc.name ?? svc.service_name ?? 'Standard Service');
  }

  const slot = b.slot as Record<string, unknown> | undefined;
  const business = b.business ?? b.salon;
  const mappedBusiness =
    business && typeof business === 'object'
      ? mapBusinessRow(business as Record<string, unknown>)
      : undefined;

  const id = b.id != null ? String(b.id) : b.booking_uuid != null ? String(b.booking_uuid) : '';
  const publicRef = String(b.reference ?? b.booking_id ?? b.public_booking_id ?? id);
  return {
    ...(b as Record<string, unknown>),
    id,
    booking_id: String(b.booking_id ?? publicRef ?? id),
    customer_user_id: String(b.customer_user_id ?? b.customer_id ?? ''),
    customer_name: String(b.customer_name ?? ''),
    customer_phone: String(b.customer_phone ?? ''),
    business_id: String(b.business_id ?? mappedBusiness?.id ?? ''),
    service_id: String(b.service_id ?? ''),
    slot_id: String(b.slot_id ?? slot?.id ?? ''),
    status: (b.status as Booking['status']) ?? 'pending',
    created_at: String(b.created_at ?? new Date().toISOString()),
    updated_at: String(b.updated_at ?? b.created_at ?? new Date().toISOString()),
    date: (() => {
      const raw =
        b.date ??
        slot?.date ??
        b.slot_date ??
        (b.created_at ? String(b.created_at).split('T')[0] : '');
      const str = String(raw ?? '');
      return str === 'undefined' || str === 'null' ? '' : str;
    })(),
    time: (() => {
      const raw = b.time ?? slot?.time ?? slot?.start_time ?? b.slot_start ?? '';
      const str = String(raw ?? '');
      return str === 'undefined' || str === 'null' ? '' : str;
    })(),
    price,
    total_price: price,
    totalPrice: price,
    services:
      mappedServices && mappedServices.length > 0
        ? mappedServices
        : b.service && typeof b.service === 'object'
          ? [
              {
                ...(b.service as object),
                price:
                  (b.service as Record<string, unknown>).price_cents != null
                    ? Number((b.service as Record<string, unknown>).price_cents) / 100
                    : Number((b.service as Record<string, unknown>).price || 0),
              },
            ]
          : [],
    service: {
      id: String(b.service_id ?? (mappedServices?.[0] as Record<string, unknown>)?.id ?? ''),
      name: serviceName,
      price,
      duration: Number(b.total_duration_minutes ?? 30),
      business_id: String(b.business_id ?? ''),
    },
    reference: publicRef,
    business: mappedBusiness,
    salon: mappedBusiness,
  } as unknown as Booking;
}

export async function enrichBusinessesWithImages(businesses: Business[]): Promise<Business[]> {
  if (!businesses?.length) return businesses || [];

  try {
    const businessIds = businesses.map((b) => b.id).filter(Boolean);
    const ownerUserIds = businesses.map((b) => b.owner_user_id).filter(Boolean);
    if (businessIds.length === 0) return businesses;

    const [bizMediaResult, profileMediaResult] = await Promise.allSettled([
      supabase
        .from('media')
        .select('id, entity_id, storage_path, bucket_name')
        .eq('entity_type', 'business')
        .in('entity_id', businessIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true }),
      ownerUserIds.length > 0
        ? supabase
            .from('media')
            .select('id, entity_id, storage_path, bucket_name')
            .eq('entity_type', 'profile')
            .in('entity_id', ownerUserIds)
            .is('deleted_at', null)
        : Promise.resolve({ data: null, error: null }),
    ]);

    const bizMediaResolved =
      bizMediaResult.status === 'fulfilled'
        ? bizMediaResult.value
        : { data: null, error: bizMediaResult.reason };
    const profileMediaResolved =
      profileMediaResult.status === 'fulfilled'
        ? profileMediaResult.value
        : { data: null, error: profileMediaResult.reason };

    if (bizMediaResolved.error) {
      logger.warn(LogTag.API, '[ENRICH] business media query failed', bizMediaResolved.error);
    }
    if (profileMediaResolved.error) {
      logger.warn(LogTag.API, '[ENRICH] profile media query failed', profileMediaResolved.error);
    }

    const bizMediaMap: Record<string, { storage_path: string; bucket_name?: string }> = {};
    if (bizMediaResolved?.data) {
      for (const item of bizMediaResolved.data) {
        if (!bizMediaMap[item.entity_id]) {
          bizMediaMap[item.entity_id] = item;
        }
      }
    }

    const profileMediaMap: Record<string, { storage_path: string; bucket_name?: string }> = {};
    if (profileMediaResolved?.data) {
      for (const item of profileMediaResolved.data) {
        if (!profileMediaMap[item.entity_id]) {
          profileMediaMap[item.entity_id] = item;
        }
      }
    }

    for (const biz of businesses) {
      // Prioritize the user's profile picture for the main business image
      const firstMedia =
        (biz.owner_user_id ? profileMediaMap[biz.owner_user_id] : null) || bizMediaMap[biz.id];
      if (firstMedia) {
        try {
          const publicUrl = supabase.storage
            .from(firstMedia.bucket_name || 'business-media')
            .getPublicUrl(firstMedia.storage_path).data.publicUrl;
          if (publicUrl) {
            biz.image_url = publicUrl;
            biz.cover_photo_url = publicUrl;
          }
        } catch (e) {
          if (__DEV__) {
            logger.info(LogTag.API, `[ENRICH] Failed public URL for business media`, e);
          }
        }
      }

      const ownerMedia = biz.owner_user_id ? profileMediaMap[biz.owner_user_id] : null;
      if (ownerMedia) {
        try {
          const ownerPublicUrl = supabase.storage
            .from(ownerMedia.bucket_name || 'business-media')
            .getPublicUrl(ownerMedia.storage_path).data.publicUrl;
          if (ownerPublicUrl) {
            biz.owner_image = ownerPublicUrl;
          }
        } catch (e) {
          if (__DEV__) {
            logger.info(LogTag.API, `[ENRICH] Failed public URL for owner media`, e);
          }
        }
      }
    }
  } catch (err) {
    if (__DEV__) {
      logger.info(LogTag.API, '[ENRICH] Failed to enrich businesses with images:', err);
    }
  }

  return businesses;
}
