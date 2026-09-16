import { pgTable, uuid, text, numeric, integer, boolean, timestamp, jsonb, bigint, varchar, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';

export const spas = pgTable('spas', {
  id: uuid('id').primaryKey(),
  numId: bigint('num_id', { mode: 'number' }),
  googlePlaceId: text('google_place_id'),
  name: text('name'),
  slug: varchar('slug', { length: 255 }),
  address: text('address'),
  phone: text('phone'),
  website: text('website'),
  description: text('description'),
  province: text('province'),
  googleMapsUri: text('google_maps_uri'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  ratingValue: numeric('rating_value'),
  reviewCount: integer('review_count'),
  messagingLinkZalo: text('messaging_link_zalo'),
  messagingLinkWhatsapp: text('messaging_link_whatsapp'),
  messagingLinkTelegram: text('messaging_link_telegram'),
  messagingLinkMessenger: text('messaging_link_messenger'),
  facebookLink: text('facebook_link'),
  instagramLink: text('instagram_link'),
  twitterLink: text('twitter_link'),
  messagingLinkKakaotalk: text('messaging_link_kakaotalk'),
  openingHours: jsonb('opening_hours'),
  photos: jsonb('photos'),
  reviews: jsonb('reviews'),
  mpZalo: jsonb('mp_zalo'),
  zaloIsOa: boolean('zalo_is_oa'),
  isTest: boolean('is_test'),
  spaAvatar: text('spa_avatar'),
  amenities: text('amenities').array(),
  amenitiesEn: text('amenities_en').array(),
  amenitiesKo: text('amenities_ko').array(),
  extraAttributes: jsonb('extra_attributes'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slugIdx: uniqueIndex('slug_idx').on(table.slug),
  }
});

export const spaLocations = pgTable('spa_locations', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  spaId: uuid('spa_id'),
  cityId: bigint('city_id', { mode: 'number' }),
  districtId: bigint('district_id', { mode: 'number' }),
  wardId: bigint('ward_id', { mode: 'number' }),
  placeId: bigint('place_id', { mode: 'number' }),
  addressLine: text('address_line'),
  lat: numeric('lat'),
  lng: numeric('lng'),
  isPrimary: boolean('is_primary'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    spaIdIdx: index('spa_locations_spa_id_idx').on(table.spaId),
    cityIdIdx: index('spa_locations_city_id_idx').on(table.cityId),
    districtIdIdx: index('spa_locations_district_id_idx').on(table.districtId),
    wardIdIdx: index('spa_locations_ward_id_idx').on(table.wardId),
    placeIdIdx: index('spa_locations_place_id_idx').on(table.placeId)
  }
});

export const spaGalleries = pgTable('spa_galleries', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  spaId: uuid('spa_id'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }),
}, (table) => {
  return {
    spaIdIdx: index('spa_galleries_spa_id_idx').on(table.spaId),
  }
});

export const spaServices = pgTable('spa_services', {
  spaId: uuid('spa_id').notNull(),
  serviceId: bigint('service_id', { mode: 'number' }).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.spaId, table.serviceId], name: 'spa_services_pkey' }),
    spaIdIdx: index('spa_services_spa_id_idx').on(table.spaId),
    serviceIdIdx: index('spa_services_service_id_idx').on(table.serviceId),
  };
});

export const spaExternalReviews = pgTable('spa_external_reviews', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  spaId: uuid('spa_id'),
  source: text('source'),
  externalReviewId: text('external_review_id'),
  authorName: text('author_name'),
  authorAvatarUrl: text('author_avatar_url'),
  rating: numeric('rating'),
  content: text('content'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rawPayload: text('raw_payload'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
}, (table) => {
  return {
    spaIdIdx: index('spa_external_reviews_spa_id_idx').on(table.spaId)
  }
});
