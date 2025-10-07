export const PRODUCT_TYPE = {
  PHYSICAL: "physical",
  DIGITAL: "digital",
  ONE_TIME: "one-time",
  SUBSCRIPTION: "subscription",
} as const;

export const LICENSE_TYPE = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  UNLIMITED: "unlimited",
} as const;

export const PRODUCT_CATEGORIES = {
  EBOOKS: "ebooks",
  TEMPLATES: "templates",
  SOFTWARE: "software",
  COURSES: "courses",
  GRAPHICS: "graphics",
  AUDIO: "audio",
  VIDEO: "video",
  FONTS: "fonts",
  PLUGINS: "plugins",
  THEMES: "themes",
  OTHER: "other",
} as const;

export const ProductSearchableFields = [
  "title",
  "description",
  "shortDescription",
  "category",
  "tags",
  "metaTitle",
  "metaDescription",
];

export const ProductFilterableFields = [
  "searchTerm",
  "category",
  "type",
  "minPrice",
  "maxPrice",
  "isActive",
  "isFeatured",
  "vendor",
  "licenseType",
];
