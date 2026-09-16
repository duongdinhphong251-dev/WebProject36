/**
 * Service type identifiers used throughout the application.
 * These are canonical, locale-agnostic identifiers for service categories.
 */

export const SERVICE_TYPES = {
  MASSAGE_HOME: 'massage-tai-nha',
  MASSAGE_FULL_BODY: 'massage-toan-than',
  MASSAGE_SPA: 'massage-spa',
  MASSAGE_NECK_SHOULDER: 'massage-vai-gay',
  MASSAGE_FEET: 'massage-chan',
  MASSAGE_THAI: 'massage-thai',
  XONG_HOI: 'xong-hoi',
} as const;

export type ServiceType =
  (typeof SERVICE_TYPES)[keyof typeof SERVICE_TYPES];
