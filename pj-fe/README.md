# Spa & Beauty SEO Marketplace - Next.js Starter

A modern, high-performance service marketplace boilerplate built with Next.js 16, TypeScript, Tailwind CSS, and Shadcn UI (Radix). Uniquely architected for maximum SEO scalability, allowing dynamic geographic pages and service-based routing across multiple languages.

## 🚀 Key Features

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Internationalization (i18n)**: Native multi-language support (VI, EN, KO) with translated URL slugs (e.g., `/vi/lay-ray-tai` vs `/en/ear-spa`).
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/).
- **Dynamic SEO Architecture**: Built-in routing patterns to scale to tens of thousands of geographic landing pages without static file duplication.
- **Structured Data Engine**: Pure TypeScript JSON-LD Schema.org generators for rich Google Search features.

## 🏗 SEO-First Architecture

### Dynamic Catch-all Geo Routing
Instead of hardcoding routes for every city and district, the application utilizes dynamic segment groups and `[...geo]` catch-all routes:
- `/[locale]/(main)/[serviceSlug]/page.tsx` -> National-level service hubs (e.g., Massage toàn quốc).
- `/[locale]/(main)/[serviceSlug]/[...geo]/page.tsx` -> Geo-level SEO pages supporting deeper nesting (City -> District).
- `/[locale]/(main)/provider/[spaSlug]/page.tsx` -> Provider detail pages.
- `/[locale]/(main)/deals/[dealSlug]/page.tsx` -> Flash-sale deal pages.

### Canonical Service Mapping
To support multiple languages gracefully, we use a decentralized slug schema mapping (`src/constants/services.ts`).
- `SERVICE_KEY` acts as an immutable identifier for each category (`EAR_SPA`, `MASSAGE`).
- Each key maps to a localized URL slug (`vi: 'lay-ray-tai'`, `en: 'ear-spa'`).
- The `LocaleSwitcher` safely traverses current dynamic segments, reads the Active Service Key, and reconstructs the mapped path for the new language.

## 📦 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment

Ensure `.env` contains the required flags or API endpoints if any backend integration is required.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📁 Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── [locale]/           # Dynamic localization context
│   │   │   ├── (main)/         # Main layout group holding menus/footers
│   │   │   │   ├── [serviceSlug]/
│   │   │   │   │   ├── [...geo]/    # Deep geographic routing (City/District)
│   │   │   │   ├── provider/        # Detail pages
│   │   │   │   ├── deals/           # Detail pages
│   ├── components/
│   │   ├── common/             # LocaleSwitcher, CustomLink, Language icons
│   │   ├── layouts/            # Header, Footer, Mobile Drawer
│   │   ├── ui/                 # Core Shadcn/Radix Primitives
│   ├── constants/
│   │   └── services.ts         # SEO Dictionary for Multi-lingual slugs
│   ├── i18n/                   # Translation JSONs & Settings
│   ├── libs/
│   │   └── seo/                # Metadata generation & JSON-LD helpers
```

## 🔧 Core Mechanics

### URL Generation (`CustomLink`)
The `<CustomLink>` component normalizes all routing, ensuring absolute locale parameters are inherently affixed to outbound URLs, solving mismatch errors when users navigate between deep localized segments.

### Schema Builders (`src/libs/seo/schema-builder.ts`)
Zero-dependency builders for pure JSON-LD injection, producing compliant WebSite, WebPage, BreadcrumbList, Organization, and specific schemas via isolated logic untethered from React renders.

## 🧹 Scripts

- `npm run dev`: Start dev server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run check`: Check types using `tsc`
- `npm run lint`: Lint code .


