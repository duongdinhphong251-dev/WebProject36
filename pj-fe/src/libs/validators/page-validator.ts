import type { PageData, GeoLevel } from '@/types/page';

export interface PageValidationError {
  field: string;
  message: string;
}

export class PageValidator {
  static validate(data: unknown): { valid: boolean; errors: PageValidationError[] } {
    const errors: PageValidationError[] = [];

    if (!data || typeof data !== 'object') {
      errors.push({ field: 'root', message: 'Data must be an object' });
      return { valid: false, errors };
    }

    const page = data as Record<string, unknown>;

    // Validate metadata
    if (!page.metadata || typeof page.metadata !== 'object') {
      errors.push({ field: 'metadata', message: 'Metadata is required' });
    } else {
      const metadata = page.metadata as Record<string, unknown>;
      if (!metadata.title || typeof metadata.title !== 'string') {
        errors.push({ field: 'metadata.title', message: 'Title is required' });
      }
      if (!metadata.description || typeof metadata.description !== 'string') {
        errors.push({ field: 'metadata.description', message: 'Description is required' });
      }
      if (!metadata.canonicalUrl || typeof metadata.canonicalUrl !== 'string') {
        errors.push({ field: 'metadata.canonicalUrl', message: 'Canonical URL is required' });
      }
      if (!metadata.locale || typeof metadata.locale !== 'string') {
        errors.push({ field: 'metadata.locale', message: 'Locale is required' });
      }
      const validGeoLevels: GeoLevel[] = ['national', 'city', 'district', 'building', 'street'];
      if (!metadata.geoLevel || !validGeoLevels.includes(metadata.geoLevel as GeoLevel)) {
        errors.push({
          field: 'metadata.geoLevel',
          message: 'Valid geoLevel is required (national, city, district, building, street)',
        });
      }
      if (!Array.isArray(metadata.breadcrumbs)) {
        errors.push({ field: 'metadata.breadcrumbs', message: 'Breadcrumbs must be an array' });
      }
    }

    // Validate heroContent
    if (!page.heroContent || typeof page.heroContent !== 'object') {
      errors.push({ field: 'heroContent', message: 'Hero content is required' });
    } else {
      const heroContent = page.heroContent as Record<string, unknown>;
      if (!heroContent.heading || typeof heroContent.heading !== 'string') {
        errors.push({ field: 'heroContent.heading', message: 'Heading is required' });
      }
      if (!heroContent.subheading || typeof heroContent.subheading !== 'string') {
        errors.push({ field: 'heroContent.subheading', message: 'Subheading is required' });
      }
    }

    // Validate data arrays (can be empty)
    if (!Array.isArray(page.spas)) {
      errors.push({ field: 'spas', message: 'Spas must be an array' });
    }
    if (!Array.isArray(page.deals)) {
      errors.push({ field: 'deals', message: 'Deals must be an array' });
    }

    return { valid: errors.length === 0, errors };
  }

  static assertValid(data: unknown): asserts data is PageData {
    const result = this.validate(data);
    if (!result.valid) {
      const messages = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Page validation failed: ${messages}`);
    }
  }
}
