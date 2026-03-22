'use server';

import Anthropic from '@anthropic-ai/sdk';
import anthropic, { AI_MODEL } from '@/lib/anthropic';
import type {
    ModuleSchema,
    ModuleFieldDefinition,
    ModuleCategoryDefinition,
    DiscoveredModule,
    ModuleDiscoveryTemplate,
    ModuleAgentConfig,
    ModulePriceType,
} from '@/lib/modules/types';
import { generateFieldId, generateCategoryId, cleanAndParseJSON } from '@/lib/modules/utils';
import { createSystemModuleAction, getSystemModuleAction } from './modules-actions';
import { BULK_INDUSTRY_CONFIGS, DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';
import { db as adminDb } from '@/lib/firebase-admin';

const SCHEMA_CONFIG = {
    minimal: { minFields: 30, maxFields: 50, minCategories: 8, maxCategories: 15, minSampleItems: 6, maxSampleItems: 10 },
    standard: { minFields: 50, maxFields: 80, minCategories: 12, maxCategories: 20, minSampleItems: 10, maxSampleItems: 15 },
    comprehensive: { minFields: 80, maxFields: 120, minCategories: 15, maxCategories: 30, minSampleItems: 15, maxSampleItems: 25 },
};

type SchemaComplexity = keyof typeof SCHEMA_CONFIG;

export interface IntegrationConfig {
    id: string;
    name: string;
    industry: string[];
    apiType: 'rest' | 'graphql' | 'webhook' | 'file';
    documentationUrl?: string;
    baseUrl?: string;
    fieldMappings: Record<string, string>;
    reverseFieldMappings?: Record<string, string>;
    transformations?: Record<string, string>;
    supportedOperations: ('import' | 'export' | 'sync' | 'webhook')[];
    authType: 'oauth2' | 'api_key' | 'basic' | 'none';
    rateLimit?: { requests: number; period: string };
    webhookEvents?: string[];
    notes?: string;
}

const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
    shopify: {
        id: 'shopify',
        name: 'Shopify',
        industry: ['retail', 'food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://shopify.dev/api/admin-rest/2024-01/resources/product',
        baseUrl: 'https://{store}.myshopify.com/admin/api/2024-01',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        rateLimit: { requests: 40, period: 'second' },
        webhookEvents: ['products/create', 'products/update', 'products/delete', 'orders/create', 'orders/updated', 'inventory_levels/update', 'collections/create', 'collections/update'],
        fieldMappings: {
            'id': 'external_id',
            'title': 'name',
            'body_html': 'description',
            'vendor': 'brand',
            'product_type': 'product_type',
            'handle': 'url_slug',
            'status': 'status',
            'published_at': 'published_date',
            'published_scope': 'visibility',
            'created_at': 'created_at',
            'updated_at': 'updated_at',
            'template_suffix': 'template',
            'tags': 'tags',
            'admin_graphql_api_id': 'graphql_id',
            'variants[0].id': 'variant_id',
            'variants[0].title': 'variant_title',
            'variants[0].price': 'price',
            'variants[0].compare_at_price': 'compare_at_price',
            'variants[0].sku': 'sku',
            'variants[0].barcode': 'barcode',
            'variants[0].grams': 'weight_grams',
            'variants[0].weight': 'weight',
            'variants[0].weight_unit': 'weight_unit',
            'variants[0].inventory_item_id': 'inventory_item_id',
            'variants[0].inventory_quantity': 'stock_quantity',
            'variants[0].old_inventory_quantity': 'previous_stock',
            'variants[0].inventory_policy': 'backorder_policy',
            'variants[0].inventory_management': 'inventory_tracking',
            'variants[0].fulfillment_service': 'fulfillment_service',
            'variants[0].requires_shipping': 'requires_shipping',
            'variants[0].taxable': 'taxable',
            'variants[0].tax_code': 'tax_code',
            'variants[0].position': 'variant_position',
            'variants[0].option1': 'option_1',
            'variants[0].option2': 'option_2',
            'variants[0].option3': 'option_3',
            'variants[0].image_id': 'variant_image_id',
            'options': 'variant_options',
            'options[0].name': 'option_1_name',
            'options[0].values': 'option_1_values',
            'options[1].name': 'option_2_name',
            'options[1].values': 'option_2_values',
            'options[2].name': 'option_3_name',
            'options[2].values': 'option_3_values',
            'images': 'images',
            'images[0].id': 'main_image_id',
            'images[0].src': 'main_image',
            'images[0].alt': 'main_image_alt',
            'images[0].width': 'main_image_width',
            'images[0].height': 'main_image_height',
            'images[0].position': 'main_image_position',
            'image.src': 'featured_image',
            'metafields': 'metafields',
            'metafields_global_title_tag': 'seo_title',
            'metafields_global_description_tag': 'seo_description',
        },
        reverseFieldMappings: {
            'name': 'title',
            'description': 'body_html',
            'brand': 'vendor',
            'product_type': 'product_type',
            'url_slug': 'handle',
            'status': 'status',
            'tags': 'tags',
            'price': 'variants[0].price',
            'compare_at_price': 'variants[0].compare_at_price',
            'sku': 'variants[0].sku',
            'barcode': 'variants[0].barcode',
            'weight_grams': 'variants[0].grams',
            'stock_quantity': 'variants[0].inventory_quantity',
            'main_image': 'images[0].src',
            'seo_title': 'metafields_global_title_tag',
            'seo_description': 'metafields_global_description_tag',
        },
        transformations: {
            'description': 'html_to_text',
            'tags': 'comma_separated_to_array',
            'price': 'string_to_number',
            'compare_at_price': 'string_to_number',
            'stock_quantity': 'string_to_number',
            'weight_grams': 'string_to_number',
        },
    },

    woocommerce: {
        id: 'woocommerce',
        name: 'WooCommerce',
        industry: ['retail', 'food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/#products',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'basic',
        webhookEvents: ['product.created', 'product.updated', 'product.deleted', 'product.restored', 'order.created', 'order.updated', 'order.deleted', 'customer.created'],
        fieldMappings: {
            'id': 'external_id',
            'name': 'name',
            'slug': 'url_slug',
            'permalink': 'external_url',
            'date_created': 'created_at',
            'date_created_gmt': 'created_at_utc',
            'date_modified': 'updated_at',
            'date_modified_gmt': 'updated_at_utc',
            'type': 'product_type',
            'status': 'status',
            'featured': 'is_featured',
            'catalog_visibility': 'visibility',
            'description': 'description',
            'short_description': 'short_description',
            'sku': 'sku',
            'price': 'price',
            'regular_price': 'mrp',
            'sale_price': 'sale_price',
            'date_on_sale_from': 'sale_start_date',
            'date_on_sale_from_gmt': 'sale_start_date_utc',
            'date_on_sale_to': 'sale_end_date',
            'date_on_sale_to_gmt': 'sale_end_date_utc',
            'price_html': 'price_display',
            'on_sale': 'on_sale',
            'purchasable': 'purchasable',
            'total_sales': 'units_sold',
            'virtual': 'is_virtual',
            'downloadable': 'is_downloadable',
            'downloads': 'downloadable_files',
            'download_limit': 'download_limit',
            'download_expiry': 'download_expiry_days',
            'external_url': 'affiliate_url',
            'button_text': 'affiliate_button_text',
            'tax_status': 'tax_status',
            'tax_class': 'tax_class',
            'manage_stock': 'track_inventory',
            'stock_quantity': 'stock_quantity',
            'stock_status': 'stock_status',
            'backorders': 'backorder_policy',
            'backorders_allowed': 'backorders_allowed',
            'backordered': 'is_backordered',
            'low_stock_amount': 'low_stock_threshold',
            'sold_individually': 'sold_individually',
            'weight': 'weight_kg',
            'dimensions.length': 'length_cm',
            'dimensions.width': 'width_cm',
            'dimensions.height': 'height_cm',
            'shipping_required': 'requires_shipping',
            'shipping_taxable': 'shipping_taxable',
            'shipping_class': 'shipping_class',
            'shipping_class_id': 'shipping_class_id',
            'reviews_allowed': 'reviews_allowed',
            'average_rating': 'average_rating',
            'rating_count': 'review_count',
            'related_ids': 'related_products',
            'upsell_ids': 'upsell_products',
            'cross_sell_ids': 'cross_sell_products',
            'parent_id': 'parent_product_id',
            'purchase_note': 'purchase_note',
            'categories': 'categories',
            'categories[0].id': 'primary_category_id',
            'categories[0].name': 'primary_category',
            'categories[0].slug': 'primary_category_slug',
            'tags': 'tags',
            'images': 'images',
            'images[0].id': 'main_image_id',
            'images[0].src': 'main_image',
            'images[0].name': 'main_image_name',
            'images[0].alt': 'main_image_alt',
            'attributes': 'attributes',
            'default_attributes': 'default_attributes',
            'variations': 'variations',
            'grouped_products': 'grouped_products',
            'menu_order': 'sort_order',
            'meta_data': 'meta_data',
            'yoast_head_json.title': 'seo_title',
            'yoast_head_json.description': 'seo_description',
            'yoast_head_json.og_title': 'og_title',
            'yoast_head_json.og_description': 'og_description',
            'yoast_head_json.og_image': 'og_image',
        },
        reverseFieldMappings: {
            'name': 'name',
            'url_slug': 'slug',
            'description': 'description',
            'short_description': 'short_description',
            'sku': 'sku',
            'mrp': 'regular_price',
            'sale_price': 'sale_price',
            'stock_quantity': 'stock_quantity',
            'track_inventory': 'manage_stock',
            'weight_kg': 'weight',
            'length_cm': 'dimensions.length',
            'width_cm': 'dimensions.width',
            'height_cm': 'dimensions.height',
            'categories': 'categories',
            'tags': 'tags',
            'main_image': 'images[0].src',
            'is_featured': 'featured',
        },
        transformations: {
            'price': 'string_to_number',
            'mrp': 'string_to_number',
            'sale_price': 'string_to_number',
            'stock_quantity': 'string_to_number',
            'weight_kg': 'string_to_number',
            'average_rating': 'string_to_number',
        },
    },

    amazon_sp: {
        id: 'amazon_sp',
        name: 'Amazon Seller Central (SP-API)',
        industry: ['retail'],
        apiType: 'rest',
        documentationUrl: 'https://developer-docs.amazon.com/sp-api/docs/catalog-items-api-v2022-04-01-reference',
        supportedOperations: ['import', 'export', 'sync'],
        authType: 'oauth2',
        rateLimit: { requests: 5, period: 'second' },
        fieldMappings: {
            'asin': 'asin',
            'sku': 'sku',
            'sellerSku': 'seller_sku',
            'fnSku': 'fn_sku',
            'itemName': 'name',
            'itemDescription': 'description',
            'listingId': 'external_id',
            'productId': 'product_id',
            'productIdType': 'product_id_type',
            'openDate': 'listing_date',
            'price': 'price',
            'businessPrice': 'business_price',
            'quantityPriceType': 'quantity_price_type',
            'quantityLowerBound1': 'qty_tier_1_min',
            'quantityPrice1': 'qty_tier_1_price',
            'quantityLowerBound2': 'qty_tier_2_min',
            'quantityPrice2': 'qty_tier_2_price',
            'fulfillmentChannel': 'fulfillment_type',
            'quantity': 'stock_quantity',
            'pendingQuantity': 'pending_stock',
            'fulfillableQuantity': 'fulfillable_stock',
            'inboundWorkingQuantity': 'inbound_stock',
            'inboundShippedQuantity': 'shipped_stock',
            'inboundReceivingQuantity': 'receiving_stock',
            'reservedQuantity': 'reserved_stock',
            'totalReservedQuantity': 'total_reserved',
            'itemCondition': 'condition',
            'itemConditionNote': 'condition_note',
            'itemNote': 'seller_note',
            'productType': 'product_type',
            'brand': 'brand',
            'manufacturer': 'manufacturer',
            'partNumber': 'part_number',
            'modelNumber': 'model_number',
            'color': 'color',
            'colorMap': 'color_family',
            'size': 'size',
            'sizeMap': 'size_family',
            'material': 'material',
            'itemPackageQuantity': 'package_quantity',
            'numberOfItems': 'number_of_items',
            'bulletPoint1': 'feature_1',
            'bulletPoint2': 'feature_2',
            'bulletPoint3': 'feature_3',
            'bulletPoint4': 'feature_4',
            'bulletPoint5': 'feature_5',
            'searchTerms': 'search_keywords',
            'platinumKeywords1': 'platinum_keyword_1',
            'platinumKeywords2': 'platinum_keyword_2',
            'mainImageUrl': 'main_image',
            'otherImageUrl1': 'image_2',
            'otherImageUrl2': 'image_3',
            'otherImageUrl3': 'image_4',
            'otherImageUrl4': 'image_5',
            'otherImageUrl5': 'image_6',
            'otherImageUrl6': 'image_7',
            'otherImageUrl7': 'image_8',
            'swatchImageUrl': 'swatch_image',
            'itemWeight': 'item_weight_kg',
            'itemWeightUnit': 'weight_unit',
            'itemLength': 'length_cm',
            'itemWidth': 'width_cm',
            'itemHeight': 'height_cm',
            'itemDimensionUnit': 'dimension_unit',
            'packageWeight': 'package_weight_kg',
            'packageLength': 'package_length_cm',
            'packageWidth': 'package_width_cm',
            'packageHeight': 'package_height_cm',
            'countryOfOrigin': 'country_of_origin',
            'targetAudience': 'target_audience',
            'ageRangeDescription': 'age_range',
            'isExpirationDatedProduct': 'has_expiry',
            'warrantyDescription': 'warranty_description',
            'cpsia_warning': 'cpsia_warning',
            'hazmat': 'is_hazmat',
        },
        reverseFieldMappings: {
            'sku': 'sku',
            'name': 'itemName',
            'description': 'itemDescription',
            'price': 'price',
            'stock_quantity': 'quantity',
            'brand': 'brand',
            'manufacturer': 'manufacturer',
            'main_image': 'mainImageUrl',
        },
    },

    flipkart: {
        id: 'flipkart',
        name: 'Flipkart Seller Hub',
        industry: ['retail'],
        apiType: 'rest',
        documentationUrl: 'https://seller.flipkart.com/api-docs/FMSAPI.html',
        supportedOperations: ['import', 'export', 'sync'],
        authType: 'oauth2',
        fieldMappings: {
            'listing_id': 'external_id',
            'sku_id': 'sku',
            'fsn': 'fsn',
            'product_id': 'product_id',
            'title': 'name',
            'description': 'description',
            'brand': 'brand',
            'manufacturer': 'manufacturer',
            'manufacturer_details': 'manufacturer_details',
            'packer_details': 'packer_details',
            'importer_details': 'importer_details',
            'selling_price': 'price',
            'mrp': 'mrp',
            'listing_status': 'status',
            'procurement_type': 'procurement_type',
            'stock_count': 'stock_quantity',
            'procurement_sla': 'procurement_sla_days',
            'shipping_days': 'shipping_days',
            'local_shipping_fee': 'local_shipping_fee',
            'zonal_shipping_fee': 'zonal_shipping_fee',
            'national_shipping_fee': 'national_shipping_fee',
            'hsn_code': 'hsn_code',
            'tax_code': 'tax_code',
            'gst_rate': 'tax_rate',
            'country_of_origin': 'country_of_origin',
            'primary_image': 'main_image',
            'image_1': 'image_2',
            'image_2': 'image_3',
            'image_3': 'image_4',
            'image_4': 'image_5',
            'image_5': 'image_6',
            'image_6': 'image_7',
            'image_7': 'image_8',
            'video_url': 'video_url',
            'category_path': 'category_path',
            'vertical': 'vertical',
            'model_name': 'model_number',
            'model_number': 'model_id',
            'color': 'color',
            'size': 'size',
            'weight': 'weight_kg',
            'length': 'length_cm',
            'breadth': 'width_cm',
            'height': 'height_cm',
            'ean': 'barcode_ean',
            'upc': 'barcode_upc',
            'isbn': 'barcode_isbn',
            'key_features': 'features',
            'search_keywords': 'search_keywords',
            'warranty': 'warranty_months',
            'warranty_type': 'warranty_type',
            'warranty_service_type': 'warranty_service_type',
            'domestic_warranty': 'domestic_warranty',
            'international_warranty': 'international_warranty',
            'shelf_life': 'shelf_life_days',
            'fssai_license': 'fssai_license',
        },
        reverseFieldMappings: {
            'sku': 'sku_id',
            'name': 'title',
            'description': 'description',
            'brand': 'brand',
            'price': 'selling_price',
            'mrp': 'mrp',
            'stock_quantity': 'stock_count',
            'main_image': 'primary_image',
        },
    },

    zomato: {
        id: 'zomato',
        name: 'Zomato for Business',
        industry: ['food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://www.zomato.com/business/apps',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'api_key',
        webhookEvents: ['order.placed', 'order.accepted', 'order.ready', 'order.dispatched', 'order.delivered', 'order.cancelled', 'menu.updated', 'item.stockout'],
        fieldMappings: {
            'item_id': 'external_id',
            'name': 'name',
            'description': 'description',
            'category_id': 'category_id',
            'category': 'category',
            'sub_category_id': 'subcategory_id',
            'sub_category': 'subcategory',
            'cuisine_id': 'cuisine_id',
            'cuisine': 'cuisine_type',
            'price': 'price',
            'mrp': 'mrp',
            'discounted_price': 'sale_price',
            'discount_percent': 'discount_percent',
            'is_veg': 'is_vegetarian',
            'is_egg': 'contains_egg',
            'is_available': 'in_stock',
            'is_recommended': 'is_featured',
            'is_bestseller': 'is_bestseller',
            'is_new': 'is_new_item',
            'is_must_try': 'is_must_try',
            'item_available_time': 'available_hours',
            'available_days': 'available_days',
            'start_time': 'available_from_time',
            'end_time': 'available_until_time',
            'image_url': 'main_image',
            'images': 'images',
            'spice_level': 'spice_level',
            'serves': 'serves_people',
            'portion_size': 'portion_size',
            'portion_unit': 'portion_unit',
            'preparation_time': 'prep_time_minutes',
            'calories': 'calories',
            'protein': 'protein_grams',
            'carbs': 'carbs_grams',
            'fat': 'fat_grams',
            'fiber': 'fiber_grams',
            'allergens': 'allergens',
            'contains_nuts': 'contains_nuts',
            'contains_dairy': 'contains_dairy',
            'contains_gluten': 'contains_gluten',
            'contains_soy': 'contains_soy',
            'is_jain': 'is_jain',
            'is_halal': 'is_halal',
            'customizations': 'customization_options',
            'customization_groups': 'customization_groups',
            'addon_groups': 'add_on_groups',
            'addons': 'add_ons',
            'variants': 'variants',
            'variant_groups': 'variant_groups',
            'tags': 'tags',
            'special_tags': 'special_tags',
            'tax_rate': 'tax_rate',
            'packaging_charge': 'packaging_charge',
            'gst_inclusive': 'tax_inclusive',
            'rank': 'sort_order',
            'rating': 'average_rating',
            'rating_count': 'rating_count',
            'order_count': 'times_ordered',
        },
        reverseFieldMappings: {
            'name': 'name',
            'description': 'description',
            'category': 'category',
            'price': 'price',
            'is_vegetarian': 'is_veg',
            'in_stock': 'is_available',
            'main_image': 'image_url',
            'spice_level': 'spice_level',
            'serves_people': 'serves',
            'prep_time_minutes': 'preparation_time',
        },
        transformations: {
            'price': 'string_to_number',
            'spice_level': 'string_to_number',
            'calories': 'string_to_number',
            'is_vegetarian': 'number_to_boolean',
        },
    },

    swiggy: {
        id: 'swiggy',
        name: 'Swiggy Partner',
        industry: ['food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://partner.swiggy.com/',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'api_key',
        webhookEvents: ['order.new', 'order.accepted', 'order.prepared', 'order.picked', 'order.delivered', 'order.cancelled', 'item.stockout', 'menu.sync'],
        fieldMappings: {
            'item_id': 'external_id',
            'external_item_id': 'sku',
            'name': 'name',
            'description': 'description',
            'category_id': 'category_id',
            'category_name': 'category',
            'sub_category_id': 'subcategory_id',
            'sub_category_name': 'subcategory',
            'price': 'price',
            'mrp': 'mrp',
            'packing_charges': 'packaging_charge',
            'is_veg': 'is_vegetarian',
            'is_egg': 'contains_egg',
            'in_stock': 'in_stock',
            'is_recommended': 'is_featured',
            'is_bestseller': 'is_bestseller',
            'image_url': 'main_image',
            'image_urls': 'images',
            'preparation_time': 'prep_time_minutes',
            'serves_for': 'serves_people',
            'serving_info': 'serving_info',
            'portion_size': 'portion_size',
            'weight_in_grams': 'weight_grams',
            'calories': 'calories',
            'spice_level': 'spice_level',
            'variants': 'variants',
            'variant_groups': 'variant_groups',
            'addons': 'add_ons',
            'addon_groups': 'add_on_groups',
            'customizations': 'customization_options',
            'item_tax_rate': 'tax_rate',
            'gst_type': 'gst_type',
            'sort_order': 'sort_order',
            'allergen_info': 'allergens',
            'contains_allergen_cereals': 'contains_gluten',
            'contains_allergen_crustaceans': 'contains_shellfish',
            'contains_allergen_eggs': 'contains_egg',
            'contains_allergen_fish': 'contains_fish',
            'contains_allergen_peanuts': 'contains_peanuts',
            'contains_allergen_soybeans': 'contains_soy',
            'contains_allergen_milk': 'contains_dairy',
            'contains_allergen_nuts': 'contains_nuts',
            'contains_allergen_celery': 'contains_celery',
            'contains_allergen_mustard': 'contains_mustard',
            'contains_allergen_sesame': 'contains_sesame',
            'contains_allergen_sulphites': 'contains_sulphites',
            'nutritional_info': 'nutrition_info',
            'protein_grams': 'protein_grams',
            'carbs_grams': 'carbs_grams',
            'fat_grams': 'fat_grams',
            'fiber_grams': 'fiber_grams',
            'sodium_mg': 'sodium_mg',
            'is_healthy': 'is_healthy',
            'is_organic': 'is_organic',
            'is_gluten_free': 'is_gluten_free',
            'cuisine_type': 'cuisine_type',
            'food_type': 'food_type',
            'meal_type': 'meal_type',
            'dish_type': 'dish_type',
            'available_time_slots': 'available_time_slots',
            'day_availability': 'available_days',
            'timing_from': 'available_from_time',
            'timing_to': 'available_until_time',
        },
        reverseFieldMappings: {
            'name': 'name',
            'description': 'description',
            'category': 'category_name',
            'price': 'price',
            'is_vegetarian': 'is_veg',
            'in_stock': 'in_stock',
            'main_image': 'image_url',
        },
    },

    uber_eats: {
        id: 'uber_eats',
        name: 'Uber Eats',
        industry: ['food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://developer.uber.com/docs/eats/api/v2/post-eats-stores-storeid-menus',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        rateLimit: { requests: 100, period: 'minute' },
        webhookEvents: ['eats.order.notification', 'eats.report.success', 'eats.report.failure'],
        fieldMappings: {
            'id': 'external_id',
            'external_data': 'sku',
            'title': 'name',
            'title.translations': 'name_translations',
            'description': 'description',
            'description.translations': 'description_translations',
            'image_url': 'main_image',
            'price_info.price': 'price',
            'price_info.currency_code': 'currency',
            'price_info.overrides': 'price_overrides',
            'quantity_info.quantity.min_permitted': 'min_quantity',
            'quantity_info.quantity.max_permitted': 'max_quantity',
            'quantity_info.quantity.charge_above': 'charge_above_quantity',
            'quantity_info.quantity.refund_under': 'refund_under_quantity',
            'suspension_info.suspension.suspend_until': 'suspended_until',
            'suspension_info.suspension.reason': 'suspension_reason',
            'modifier_group_ids.ids': 'modifier_groups',
            'tax_info.tax_rate': 'tax_rate',
            'tax_info.vat_rate_percentage': 'vat_rate',
            'tax_labels': 'tax_labels',
            'nutritional_info.calories.lower_range': 'calories_min',
            'nutritional_info.calories.upper_range': 'calories_max',
            'nutritional_info.kilojoules.lower_range': 'kilojoules_min',
            'nutritional_info.kilojoules.upper_range': 'kilojoules_max',
            'nutritional_info.serving_size': 'serving_size',
            'nutritional_info.number_of_servings': 'servings_count',
            'dish_info.classifications.alcoholic_items': 'is_alcoholic',
            'dish_info.classifications.dietary_label_info.labels': 'dietary_labels',
            'dish_info.classifications.instructions_for_use': 'preparation_instructions',
            'dish_info.classifications.additives': 'additives',
            'dish_info.classifications.contains_alcohol': 'contains_alcohol',
            'visibility_info.hours': 'available_hours',
            'available': 'in_stock',
        },
    },

    booking_com: {
        id: 'booking_com',
        name: 'Booking.com Connectivity',
        industry: ['hospitality'],
        apiType: 'rest',
        documentationUrl: 'https://connect.booking.com/user_guide/site/en-US/api-reference/ota-api/',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        rateLimit: { requests: 10, period: 'second' },
        webhookEvents: ['reservation.new', 'reservation.modified', 'reservation.cancelled', 'room.availability_update', 'rate.update'],
        fieldMappings: {
            'room_id': 'external_id',
            'room_name': 'name',
            'room_name_translations': 'name_translations',
            'room_description': 'description',
            'room_description_translations': 'description_translations',
            'room_type': 'room_type',
            'room_type_id': 'room_type_id',
            'class_id': 'room_class_id',
            'max_occupancy': 'max_occupancy',
            'max_adults': 'max_adults',
            'max_children': 'max_children',
            'max_infants': 'max_infants',
            'min_occupancy': 'min_occupancy',
            'standard_occupancy': 'standard_occupancy',
            'bed_configurations': 'bed_configurations',
            'bed_type': 'bed_type',
            'bed_count': 'bed_count',
            'extra_bed_available': 'extra_bed_available',
            'crib_available': 'crib_available',
            'room_size': 'room_size_sqm',
            'room_size_unit': 'room_size_unit',
            'floor': 'floor_number',
            'floor_count': 'total_floors',
            'view_type': 'view_type',
            'smoking': 'smoking_allowed',
            'balcony': 'has_balcony',
            'base_rate': 'base_price',
            'rack_rate': 'rack_rate',
            'min_rate': 'min_rate',
            'max_rate': 'max_rate',
            'currency': 'currency',
            'rate_type': 'rate_type',
            'rate_plan_id': 'rate_plan_id',
            'rate_plan_name': 'rate_plan_name',
            'meal_plan': 'meal_plan',
            'breakfast_included': 'breakfast_included',
            'lunch_included': 'lunch_included',
            'dinner_included': 'dinner_included',
            'all_inclusive': 'all_inclusive',
            'cancellation_policy': 'cancellation_policy',
            'cancellation_policy_id': 'cancellation_policy_id',
            'refundable': 'is_refundable',
            'free_cancellation_until': 'free_cancellation_date',
            'prepayment_required': 'prepayment_required',
            'deposit_required': 'deposit_required',
            'deposit_amount': 'deposit_amount',
            'taxes_included': 'tax_inclusive',
            'tax_rate': 'tax_rate',
            'service_charge': 'service_charge',
            'resort_fee': 'resort_fee',
            'city_tax': 'city_tax',
            'amenities': 'amenities',
            'room_amenities': 'room_amenities',
            'bathroom_amenities': 'bathroom_amenities',
            'kitchen_amenities': 'kitchen_amenities',
            'tech_amenities': 'tech_amenities',
            'photos': 'images',
            'main_photo': 'main_image',
            'video_url': 'video_url',
            'virtual_tour_url': 'virtual_tour_url',
            'availability_status': 'availability_status',
            'inventory_count': 'available_rooms',
            'closed_to_arrival': 'closed_to_arrival',
            'closed_to_departure': 'closed_to_departure',
            'min_stay': 'minimum_nights',
            'max_stay': 'maximum_nights',
            'min_advance_booking': 'min_advance_booking_days',
            'max_advance_booking': 'max_advance_booking_days',
            'check_in_time': 'check_in_time',
            'check_out_time': 'check_out_time',
            'early_check_in_available': 'early_check_in_available',
            'late_check_out_available': 'late_check_out_available',
        },
        reverseFieldMappings: {
            'name': 'room_name',
            'description': 'room_description',
            'room_type': 'room_type',
            'max_occupancy': 'max_occupancy',
            'base_price': 'base_rate',
            'main_image': 'main_photo',
            'minimum_nights': 'min_stay',
        },
    },

    airbnb: {
        id: 'airbnb',
        name: 'Airbnb Host API',
        industry: ['hospitality', 'real_estate'],
        apiType: 'rest',
        documentationUrl: 'https://www.airbnb.com/partner',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        webhookEvents: ['reservation_request', 'reservation_confirmation', 'reservation_cancelled', 'message_received', 'review_submitted'],
        fieldMappings: {
            'listing_id': 'external_id',
            'name': 'name',
            'summary': 'short_description',
            'description': 'description',
            'space': 'space_description',
            'access': 'access_description',
            'interaction': 'host_interaction',
            'neighborhood_overview': 'neighborhood_description',
            'transit': 'transit_description',
            'notes': 'notes',
            'house_rules': 'house_rules',
            'property_type': 'property_type',
            'room_type': 'room_type',
            'bed_type': 'bed_type',
            'accommodates': 'max_guests',
            'bedrooms': 'bedrooms',
            'beds': 'bed_count',
            'bathrooms': 'bathrooms',
            'bathrooms_text': 'bathroom_description',
            'square_feet': 'room_size_sqft',
            'square_meters': 'room_size_sqm',
            'price': 'base_price',
            'weekly_price': 'weekly_rate',
            'monthly_price': 'monthly_rate',
            'cleaning_fee': 'cleaning_fee',
            'security_deposit': 'security_deposit',
            'extra_people': 'extra_guest_fee',
            'guests_included': 'guests_included_in_price',
            'price_per_extra_person': 'price_per_extra_person',
            'minimum_nights': 'minimum_nights',
            'maximum_nights': 'maximum_nights',
            'minimum_minimum_nights': 'absolute_min_nights',
            'maximum_minimum_nights': 'seasonal_min_nights',
            'minimum_maximum_nights': 'seasonal_max_nights',
            'maximum_maximum_nights': 'absolute_max_nights',
            'calendar_updated': 'calendar_last_updated',
            'has_availability': 'has_availability',
            'availability_30': 'availability_next_30_days',
            'availability_60': 'availability_next_60_days',
            'availability_90': 'availability_next_90_days',
            'availability_365': 'availability_next_365_days',
            'calendar_last_scraped': 'calendar_scraped_at',
            'instant_bookable': 'instant_booking',
            'is_business_travel_ready': 'business_ready',
            'cancellation_policy': 'cancellation_policy',
            'require_guest_profile_picture': 'require_guest_photo',
            'require_guest_phone_verification': 'require_guest_phone',
            'calculated_host_listings_count': 'host_total_listings',
            'amenities': 'amenities',
            'photos': 'images',
            'picture_url': 'main_image',
            'xl_picture_url': 'main_image_xl',
            'medium_url': 'main_image_medium',
            'thumbnail_url': 'thumbnail',
            'host_id': 'host_id',
            'host_url': 'host_url',
            'host_name': 'host_name',
            'host_since': 'host_since',
            'host_location': 'host_location',
            'host_about': 'host_about',
            'host_response_time': 'host_response_time',
            'host_response_rate': 'host_response_rate',
            'host_acceptance_rate': 'host_acceptance_rate',
            'host_is_superhost': 'is_superhost',
            'host_thumbnail_url': 'host_thumbnail',
            'host_picture_url': 'host_picture',
            'host_verifications': 'host_verifications',
            'host_has_profile_pic': 'host_has_photo',
            'host_identity_verified': 'host_verified',
            'neighbourhood': 'neighborhood',
            'neighbourhood_cleansed': 'neighborhood_normalized',
            'neighbourhood_group_cleansed': 'neighborhood_group',
            'latitude': 'latitude',
            'longitude': 'longitude',
            'street': 'street',
            'city': 'city',
            'state': 'state',
            'zipcode': 'pin_code',
            'market': 'market',
            'smart_location': 'smart_location',
            'country_code': 'country_code',
            'country': 'country',
            'is_location_exact': 'location_exact',
            'review_scores_rating': 'average_rating',
            'review_scores_accuracy': 'accuracy_rating',
            'review_scores_cleanliness': 'cleanliness_rating',
            'review_scores_checkin': 'checkin_rating',
            'review_scores_communication': 'communication_rating',
            'review_scores_location': 'location_rating',
            'review_scores_value': 'value_rating',
            'number_of_reviews': 'review_count',
            'number_of_reviews_ltm': 'reviews_last_12_months',
            'first_review': 'first_review_date',
            'last_review': 'last_review_date',
            'reviews_per_month': 'reviews_per_month',
            'license': 'license_number',
        },
    },

    oyo: {
        id: 'oyo',
        name: 'OYO Partner Central',
        industry: ['hospitality'],
        apiType: 'rest',
        supportedOperations: ['import', 'export', 'sync'],
        authType: 'api_key',
        fieldMappings: {
            'room_id': 'external_id',
            'room_name': 'name',
            'room_description': 'description',
            'category': 'room_type',
            'category_id': 'room_type_id',
            'sub_category': 'room_class',
            'max_occupancy': 'max_occupancy',
            'max_adults': 'max_adults',
            'max_children': 'max_children',
            'extra_bed_available': 'extra_bed_available',
            'bed_type': 'bed_type',
            'bed_count': 'bed_count',
            'room_size': 'room_size_sqft',
            'floor': 'floor_number',
            'base_price': 'base_price',
            'oyo_price': 'oyo_price',
            'rack_rate': 'rack_rate',
            'weekend_price': 'weekend_rate',
            'seasonal_price': 'seasonal_rate',
            'tax_rate': 'tax_rate',
            'amenities': 'amenities',
            'ac': 'has_ac',
            'wifi': 'has_wifi',
            'tv': 'has_tv',
            'geyser': 'has_geyser',
            'breakfast': 'breakfast_included',
            'parking': 'parking_available',
            'power_backup': 'power_backup',
            'photos': 'images',
            'main_photo': 'main_image',
            'inventory': 'available_rooms',
            'is_active': 'is_active',
            'check_in': 'check_in_time',
            'check_out': 'check_out_time',
        },
    },

    makemytrip: {
        id: 'makemytrip',
        name: 'MakeMyTrip Extranet',
        industry: ['hospitality'],
        apiType: 'rest',
        supportedOperations: ['import', 'export', 'sync'],
        authType: 'api_key',
        fieldMappings: {
            'room_type_id': 'external_id',
            'room_type_name': 'name',
            'description': 'description',
            'room_category': 'room_type',
            'room_view': 'view_type',
            'max_adults': 'max_adults',
            'max_children': 'max_children',
            'max_occupancy': 'max_occupancy',
            'bed_type': 'bed_type',
            'bed_count': 'bed_count',
            'room_size': 'room_size_sqft',
            'floor': 'floor_number',
            'smoking': 'smoking_allowed',
            'base_rate': 'base_price',
            'weekend_rate': 'weekend_rate',
            'tax_inclusive': 'tax_inclusive',
            'tax_rate': 'tax_rate',
            'breakfast_included': 'breakfast_included',
            'meal_plan': 'meal_plan',
            'cancellation_policy': 'cancellation_policy',
            'amenities': 'amenities',
            'room_amenities': 'room_amenities',
            'images': 'images',
            'main_image': 'main_image',
            'availability': 'availability_status',
            'inventory': 'available_rooms',
            'min_nights': 'minimum_nights',
            'max_nights': 'maximum_nights',
        },
    },

    magicbricks: {
        id: 'magicbricks',
        name: 'MagicBricks',
        industry: ['real_estate'],
        apiType: 'rest',
        supportedOperations: ['import', 'export'],
        authType: 'api_key',
        fieldMappings: {
            'property_id': 'external_id',
            'title': 'name',
            'description': 'description',
            'property_type': 'property_type',
            'property_sub_type': 'property_subtype',
            'transaction_type': 'listing_type',
            'possession_type': 'possession_status',
            'price': 'asking_price',
            'price_per_sqft': 'price_per_sqft',
            'price_negotiable': 'negotiable',
            'all_inclusive_price': 'all_inclusive',
            'maintenance': 'maintenance_charges',
            'maintenance_period': 'maintenance_period',
            'booking_amount': 'booking_amount',
            'built_up_area': 'built_up_area_sqft',
            'carpet_area': 'carpet_area_sqft',
            'super_built_up_area': 'super_built_up_area',
            'plot_area': 'plot_area',
            'area_unit': 'area_unit',
            'bedrooms': 'bedrooms',
            'bathrooms': 'bathrooms',
            'balconies': 'balconies',
            'study_room': 'has_study_room',
            'servant_room': 'has_servant_room',
            'puja_room': 'has_puja_room',
            'store_room': 'has_store_room',
            'floor': 'floor_number',
            'total_floors': 'total_floors',
            'tower_name': 'tower_name',
            'unit_number': 'unit_number',
            'property_age': 'age_years',
            'age_of_construction': 'construction_age',
            'possession_by': 'possession_date',
            'furnishing': 'furnishing_status',
            'furnishing_details': 'furnishing_details',
            'facing': 'facing_direction',
            'flooring_type': 'flooring_type',
            'parking_covered': 'covered_parking',
            'parking_open': 'open_parking',
            'parking_count': 'parking_count',
            'amenities': 'amenities',
            'society_amenities': 'society_amenities',
            'images': 'images',
            'main_image': 'main_image',
            'floor_plan': 'floor_plan_image',
            'video_url': 'video_url',
            'virtual_tour': 'virtual_tour_url',
            'address': 'address',
            'locality': 'locality',
            'sub_locality': 'sub_locality',
            'landmark': 'landmark',
            'city': 'city',
            'state': 'state',
            'pincode': 'pin_code',
            'latitude': 'latitude',
            'longitude': 'longitude',
            'rera_id': 'rera_number',
            'rera_registered': 'rera_registered',
            'approved_banks': 'approved_banks',
            'loan_available': 'loan_available',
            'owner_type': 'ownership_type',
            'posted_by': 'listed_by',
            'posted_by_type': 'lister_type',
            'posted_date': 'listing_date',
            'last_updated': 'updated_at',
            'status': 'status',
            'views': 'views_count',
            'enquiries': 'inquiries_count',
            'shortlisted': 'shortlisted_count',
        },
    },

    housing_com: {
        id: 'housing_com',
        name: 'Housing.com',
        industry: ['real_estate'],
        apiType: 'rest',
        supportedOperations: ['import', 'export'],
        authType: 'api_key',
        fieldMappings: {
            'listing_id': 'external_id',
            'title': 'name',
            'description': 'description',
            'property_type': 'property_type',
            'listing_type': 'listing_type',
            'price': 'asking_price',
            'rent': 'monthly_rent',
            'deposit': 'security_deposit',
            'maintenance': 'maintenance_charges',
            'super_area': 'super_built_up_area',
            'carpet_area': 'carpet_area_sqft',
            'built_up_area': 'built_up_area_sqft',
            'configuration': 'configuration',
            'bedrooms': 'bedrooms',
            'bathrooms': 'bathrooms',
            'balconies': 'balconies',
            'floor': 'floor_number',
            'total_floor': 'total_floors',
            'age': 'age_years',
            'furnishing': 'furnishing_status',
            'facing': 'facing_direction',
            'amenities': 'amenities',
            'society_amenities': 'society_amenities',
            'images': 'images',
            'main_image': 'main_image',
            'video_tour': 'video_tour_url',
            'address': 'address',
            'locality': 'locality',
            'city': 'city',
            'rera_registered': 'rera_registered',
            'rera_id': 'rera_number',
            'available_from': 'available_from',
            'preferred_tenant': 'preferred_tenant',
        },
    },

    nobroker: {
        id: 'nobroker',
        name: 'NoBroker',
        industry: ['real_estate'],
        apiType: 'rest',
        supportedOperations: ['import', 'export'],
        authType: 'api_key',
        fieldMappings: {
            'id': 'external_id',
            'title': 'name',
            'description': 'description',
            'property_type': 'property_type',
            'listing_type': 'listing_type',
            'rent': 'monthly_rent',
            'price': 'asking_price',
            'deposit': 'security_deposit',
            'maintenance': 'maintenance_charges',
            'built_up_area': 'built_up_area_sqft',
            'carpet_area': 'carpet_area_sqft',
            'bedrooms': 'bedrooms',
            'bathrooms': 'bathrooms',
            'balconies': 'balconies',
            'floor': 'floor_number',
            'total_floors': 'total_floors',
            'property_age': 'age_years',
            'furnishing': 'furnishing_status',
            'facing': 'facing_direction',
            'parking': 'parking_count',
            'amenities': 'amenities',
            'photos': 'images',
            'main_photo': 'main_image',
            'locality': 'locality',
            'city': 'city',
            'available_from': 'available_from',
            'tenant_preference': 'preferred_tenant',
            'food_preference': 'non_veg_allowed',
            'pets_allowed': 'pets_allowed',
        },
    },

    practo: {
        id: 'practo',
        name: 'Practo',
        industry: ['healthcare'],
        apiType: 'rest',
        supportedOperations: ['import', 'export', 'sync'],
        authType: 'oauth2',
        fieldMappings: {
            'service_id': 'external_id',
            'name': 'name',
            'description': 'description',
            'specialty_id': 'specialty_id',
            'specialty': 'specialty',
            'consultation_type': 'service_type',
            'fee': 'consultation_fee',
            'discounted_fee': 'discounted_fee',
            'duration': 'appointment_duration',
            'break_duration': 'break_duration',
            'available_online': 'telehealth_available',
            'available_at_clinic': 'in_person_available',
            'available_days': 'available_days',
            'time_slots': 'available_time_slots',
            'advance_booking_days': 'advance_booking_days',
            'cancellation_allowed': 'cancellation_allowed',
            'reschedule_allowed': 'reschedule_allowed',
            'instant_booking': 'instant_booking',
        },
    },

    cardekho: {
        id: 'cardekho',
        name: 'CarDekho',
        industry: ['automotive'],
        apiType: 'rest',
        supportedOperations: ['import', 'export'],
        authType: 'api_key',
        fieldMappings: {
            'listing_id': 'external_id',
            'title': 'name',
            'description': 'description',
            'make': 'brand',
            'model': 'model',
            'variant': 'variant',
            'year': 'model_year',
            'manufacturing_month': 'manufacturing_month',
            'price': 'asking_price',
            'km_driven': 'odometer_km',
            'fuel_type': 'fuel_type',
            'transmission': 'transmission',
            'owners': 'owners_count',
            'registration_city': 'registration_city',
            'registration_state': 'registration_state',
            'registration_year': 'registration_year',
            'rto': 'rto_code',
            'insurance_type': 'insurance_type',
            'insurance_validity': 'insurance_valid_until',
            'color': 'body_color',
            'mileage': 'mileage_kmpl',
            'engine_cc': 'engine_cc',
            'power_bhp': 'power_bhp',
            'torque': 'torque_nm',
            'seats': 'seating_capacity',
            'body_type': 'body_type',
            'images': 'images',
            'main_image': 'main_image',
            'features': 'features',
            'safety_features': 'safety_features',
            'comfort_features': 'comfort_features',
            'condition': 'vehicle_condition',
            'certified': 'certified_pre_owned',
            'inspection_done': 'inspection_done',
            'inspection_score': 'inspection_score',
            'service_history': 'service_history_available',
            'accidental': 'has_accidents',
        },
    },

    olx_autos: {
        id: 'olx_autos',
        name: 'OLX Autos',
        industry: ['automotive'],
        apiType: 'rest',
        supportedOperations: ['import', 'export'],
        authType: 'api_key',
        fieldMappings: {
            'ad_id': 'external_id',
            'title': 'name',
            'description': 'description',
            'brand': 'brand',
            'model': 'model',
            'variant': 'variant',
            'year': 'model_year',
            'price': 'asking_price',
            'km_driven': 'odometer_km',
            'fuel': 'fuel_type',
            'transmission': 'transmission',
            'no_of_owners': 'owners_count',
            'color': 'body_color',
            'images': 'images',
            'main_image': 'main_image',
            'location': 'location',
            'city': 'city',
            'inspection_report': 'inspection_score',
        },
    },

    square_pos: {
        id: 'square_pos',
        name: 'Square POS',
        industry: ['retail', 'food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://developer.squareup.com/reference/square/catalog-api',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        rateLimit: { requests: 300, period: 'minute' },
        webhookEvents: ['catalog.version.updated', 'inventory.count.updated', 'order.created', 'order.updated', 'payment.completed'],
        fieldMappings: {
            'id': 'external_id',
            'type': 'item_type',
            'updated_at': 'updated_at',
            'created_at': 'created_at',
            'version': 'version',
            'is_deleted': 'is_deleted',
            'item_data.name': 'name',
            'item_data.description': 'description',
            'item_data.abbreviation': 'abbreviation',
            'item_data.label_color': 'label_color',
            'item_data.available_online': 'available_online',
            'item_data.available_for_pickup': 'available_for_pickup',
            'item_data.available_electronically': 'available_electronically',
            'item_data.category_id': 'category_id',
            'item_data.tax_ids': 'tax_ids',
            'item_data.product_type': 'product_type',
            'item_data.skip_modifier_screen': 'skip_modifier_screen',
            'item_data.variations': 'variations',
            'item_data.variations[0].id': 'variation_id',
            'item_data.variations[0].item_variation_data.name': 'variation_name',
            'item_data.variations[0].item_variation_data.sku': 'sku',
            'item_data.variations[0].item_variation_data.price_money.amount': 'price_cents',
            'item_data.variations[0].item_variation_data.price_money.currency': 'currency',
            'item_data.variations[0].item_variation_data.pricing_type': 'pricing_type',
            'item_data.variations[0].item_variation_data.track_inventory': 'track_inventory',
            'item_data.variations[0].item_variation_data.sellable': 'sellable',
            'item_data.variations[0].item_variation_data.stockable': 'stockable',
            'item_data.modifier_list_info': 'modifier_lists',
            'item_data.image_ids': 'image_ids',
        },
        transformations: {
            'price_cents': 'cents_to_currency',
        },
    },

    toast_pos: {
        id: 'toast_pos',
        name: 'Toast POS',
        industry: ['food_beverage'],
        apiType: 'rest',
        documentationUrl: 'https://doc.toasttab.com/openapi/menus/index.html',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        webhookEvents: ['menu.updated', 'order.created', 'order.updated', 'payment.completed', 'check.updated'],
        fieldMappings: {
            'guid': 'external_id',
            'entityType': 'entity_type',
            'name': 'name',
            'description': 'description',
            'image': 'main_image',
            'imageLink': 'image_url',
            'visibility': 'visibility',
            'plu': 'sku',
            'price': 'price',
            'pricingStrategy': 'pricing_strategy',
            'priceLevels': 'price_levels',
            'unitOfMeasure': 'unit_of_measure',
            'taxable': 'taxable',
            'taxRates': 'tax_rates',
            'calories': 'calories',
            'servingSize': 'serving_size',
            'servingSizeUnit': 'serving_size_unit',
            'optionGroups': 'option_groups',
            'modifierGroups': 'modifier_groups',
            'salesCategory.guid': 'sales_category_id',
            'salesCategory.name': 'sales_category',
            'menuGroup.guid': 'menu_group_id',
            'menuGroup.name': 'menu_group',
            'orderableOnline': 'available_online',
            'orderableOnPOS': 'available_pos',
            'orderableOnKiosk': 'available_kiosk',
            'stockQuantity': 'stock_quantity',
            'outOfStock': 'out_of_stock',
        },
    },

    lightspeed_retail: {
        id: 'lightspeed_retail',
        name: 'Lightspeed Retail',
        industry: ['retail'],
        apiType: 'rest',
        documentationUrl: 'https://developers.lightspeedhq.com/retail/',
        supportedOperations: ['import', 'export', 'sync', 'webhook'],
        authType: 'oauth2',
        fieldMappings: {
            'itemID': 'external_id',
            'systemSku': 'system_sku',
            'defaultCost': 'cost_price',
            'avgCost': 'average_cost',
            'discountable': 'discountable',
            'tax': 'taxable',
            'archived': 'archived',
            'itemType': 'item_type',
            'description': 'name',
            'ean': 'barcode_ean',
            'upc': 'barcode_upc',
            'customSku': 'sku',
            'manufacturerSku': 'manufacturer_sku',
            'createTime': 'created_at',
            'timeStamp': 'updated_at',
            'categoryID': 'category_id',
            'taxClassID': 'tax_class_id',
            'departmentID': 'department_id',
            'itemMatrixID': 'matrix_id',
            'manufacturerID': 'manufacturer_id',
            'seasonID': 'season_id',
            'defaultVendorID': 'vendor_id',
            'Prices.ItemPrice[0].amount': 'price',
            'Prices.ItemPrice[0].useType': 'price_type',
            'ItemShops.ItemShop[0].qoh': 'stock_quantity',
            'ItemShops.ItemShop[0].reorderPoint': 'reorder_level',
            'ItemShops.ItemShop[0].reorderLevel': 'reorder_quantity',
            'Images.Image[0].baseImageURL': 'main_image',
        },
    },
};

const CORE_FIELDS: Record<string, ModuleFieldDefinition[]> = {
    all: [
        { id: 'name', name: 'Name', type: 'text', description: 'Display name', isRequired: true, isSearchable: true, showInList: true, showInCard: true, order: 1 },
        { id: 'description', name: 'Description', type: 'textarea', description: 'Detailed description', isRequired: false, isSearchable: true, showInList: false, showInCard: true, order: 2 },
        { id: 'short_description', name: 'Short Description', type: 'text', description: 'Brief summary', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 3 },
        { id: 'category', name: 'Category', type: 'select', description: 'Primary category', isRequired: true, isSearchable: true, showInList: true, showInCard: true, options: [], order: 4 },
        { id: 'status', name: 'Status', type: 'select', description: 'Current status', isRequired: true, isSearchable: false, showInList: true, showInCard: false, options: ['Active', 'Inactive', 'Draft', 'Archived'], order: 5 },
        { id: 'main_image', name: 'Main Image', type: 'image', description: 'Primary image', isRequired: false, isSearchable: false, showInList: true, showInCard: true, order: 6 },
        { id: 'images', name: 'Gallery', type: 'tags', description: 'Additional images', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 7 },
        { id: 'tags', name: 'Tags', type: 'tags', description: 'Searchable tags', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 8 },
        { id: 'is_featured', name: 'Featured', type: 'toggle', description: 'Show in featured', isRequired: false, isSearchable: false, showInList: true, showInCard: false, order: 9 },
        { id: 'is_active', name: 'Active', type: 'toggle', description: 'Available to customers', isRequired: false, isSearchable: false, showInList: true, showInCard: false, order: 10 },
        { id: 'sort_order', name: 'Sort Order', type: 'number', description: 'Display order', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 11 },
        { id: 'internal_notes', name: 'Internal Notes', type: 'textarea', description: 'Staff notes', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 12 },
    ],
    integration: [
        { id: 'external_id', name: 'External ID', type: 'text', description: 'ID from source system', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 100 },
        { id: 'external_source', name: 'Source', type: 'select', description: 'Import source', isRequired: false, isSearchable: true, showInList: false, showInCard: false, options: Object.values(INTEGRATION_CONFIGS).map(c => c.name).concat(['Manual', 'API', 'CSV']), order: 101 },
        { id: 'external_url', name: 'Source URL', type: 'url', description: 'Link to source', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 102 },
        { id: 'last_synced_at', name: 'Last Synced', type: 'date', description: 'Last sync time', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 103 },
        { id: 'sync_enabled', name: 'Auto Sync', type: 'toggle', description: 'Keep in sync', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 104 },
        { id: 'sync_direction', name: 'Sync Direction', type: 'select', description: 'How to sync', isRequired: false, isSearchable: false, showInList: false, showInCard: false, options: ['Import Only', 'Export Only', 'Bidirectional'], order: 105 },
    ],
};

const INDUSTRY_FIELD_GROUPS: Record<string, { essential: string[]; operational: string[]; advanced: string[] }> = {
    hospitality: {
        essential: ['Room Identity (room_number, floor, wing, room_type, room_class, view_type)', 'Capacity (max_adults, max_children, max_occupancy, bed_type, bed_count)', 'Pricing (base_price, weekday_rate, weekend_rate, tax_rate, service_charge)', 'Amenities (wifi, ac, tv, minibar, safe, bathroom_type)', 'Availability (availability_status, instant_booking, minimum_nights)'],
        operational: ['Policies (check_in_time, check_out_time, cancellation_policy, pet_policy, smoking_allowed)', 'Dimensions (room_size_sqft, bathroom_count, balcony)', 'Housekeeping (cleaning_frequency, last_cleaned, turnover_time)', 'Seasonal Pricing (peak_rate, off_season_rate, holiday_rate, long_stay_discount)'],
        advanced: ['Accessibility (wheelchair_accessible, accessible_bathroom, hearing_aids)', 'Luxury (private_pool, jacuzzi, butler_service, pillow_menu)', 'Performance (average_rating, review_count, occupancy_rate, revenue_per_night)', 'Sustainability (eco_certified, energy_rating, water_saving)'],
    },
    food_beverage: {
        essential: ['Basic (item_code, cuisine_type, meal_type, course_type)', 'Pricing (price, cost_price, tax_rate, discount_eligible)', 'Dietary (is_vegetarian, is_vegan, is_gluten_free, allergens)', 'Availability (in_stock, available_all_day, seasonal_item)', 'Portion (portion_size, serves_people, calories)'],
        operational: ['Preparation (prep_time_minutes, cooking_time, cooking_method, difficulty)', 'Ingredients (main_ingredients, contains_nuts, contains_dairy)', 'Customization (spice_adjustable, add_ons_available, substitutions_allowed)', 'Kitchen (station, printer_routing, plating_instructions)'],
        advanced: ['Nutrition (protein_grams, carbs_grams, fat_grams, sodium_mg)', 'Pairings (recommended_beverages, complementary_dishes)', 'Performance (times_ordered, average_rating, profit_margin)', 'Sustainability (locally_sourced, organic, seasonal_ingredients)'],
    },
    retail: {
        essential: ['Identity (sku, barcode, brand, model_number)', 'Pricing (mrp, selling_price, cost_price, discount_percent, tax_rate)', 'Inventory (stock_quantity, reorder_level, warehouse_location)', 'Physical (weight_kg, length_cm, width_cm, height_cm, color, material)', 'Availability (in_stock, available_online, available_in_store)'],
        operational: ['Variants (has_variants, size_options, color_options, parent_sku)', 'Supplier (vendor_name, vendor_sku, lead_time_days, moq)', 'Shipping (shipping_weight, shipping_class, free_shipping_eligible)', 'Returns (returnable, return_window_days, warranty_months)'],
        advanced: ['SEO (meta_title, meta_description, url_slug, search_keywords)', 'Cross-sell (related_products, frequently_bought_together, upsell_items)', 'Performance (units_sold, revenue, conversion_rate, page_views)', 'Certifications (eco_friendly, organic_certified, fair_trade)'],
    },
    healthcare: {
        essential: ['Identity (service_code, cpt_code, department, specialty)', 'Pricing (consultation_fee, procedure_fee, insurance_billable)', 'Duration (appointment_duration, procedure_duration, recovery_time)', 'Availability (available_days, telehealth_available, walk_in_available)', 'Requirements (prerequisites, fasting_required, consent_required)'],
        operational: ['Staff (physician_required, specialist_type, nursing_staff)', 'Facility (room_type_required, equipment_needed, sterile_environment)', 'Pre-procedure (pre_procedure_instructions, medication_adjustments)', 'Post-procedure (aftercare_instructions, follow_up_required)'],
        advanced: ['Insurance (pre_authorization_required, copay_amount, covered_procedures)', 'Quality (success_rate, complication_rate, patient_satisfaction)', 'Compliance (accreditation_required, license_requirements)', 'Documentation (consent_form, instruction_sheet)'],
    },
    education: {
        essential: ['Identity (course_code, subject, level, department)', 'Pricing (course_fee, material_fee, exam_fee, installment_available)', 'Duration (total_weeks, hours_per_week, credit_hours)', 'Schedule (start_date, end_date, enrollment_deadline, delivery_mode)', 'Prerequisites (required_courses, skill_level, minimum_age)'],
        operational: ['Curriculum (modules_count, topics_covered, learning_objectives)', 'Materials (textbooks_required, software_required, equipment_needed)', 'Assessment (assessment_types, passing_grade, certification_awarded)', 'Faculty (instructor_name, instructor_credentials)'],
        advanced: ['Outcomes (completion_rate, job_placement_rate, salary_increase)', 'Accreditation (accreditation_body, transferable_credits)', 'Financial Aid (scholarship_available, loan_available)', 'Reviews (course_rating, review_count)'],
    },
    services: {
        essential: ['Identity (service_code, service_type, expertise_area)', 'Pricing (hourly_rate, project_rate, minimum_charge, tax_rate)', 'Duration (standard_duration, minimum_booking, buffer_time)', 'Availability (available_days, available_hours, lead_time_days)', 'Location (service_area, on_site, remote_available, travel_fee)'],
        operational: ['Requirements (equipment_needed, space_required, client_preparation)', 'Staff (staff_count, certification_required, experience_years)', 'Add-ons (available_add_ons, package_options, premium_upgrades)', 'Policies (cancellation_policy, deposit_required, payment_terms)'],
        advanced: ['Quality (service_guarantee, warranty_period, certifications)', 'Performance (jobs_completed, repeat_client_rate, satisfaction_score)', 'Insurance (liability_coverage, bonded, workers_comp)', 'Sustainability (eco_friendly_options, green_certified)'],
    },
    real_estate: {
        essential: ['Location (address, locality, city, state, pin_code)', 'Pricing (asking_price, price_per_sqft, monthly_rent, security_deposit)', 'Configuration (bedrooms, bathrooms, balconies, parking_count)', 'Area (built_up_area_sqft, carpet_area_sqft, plot_area)', 'Details (property_type, listing_type, furnishing_status, floor_number)'],
        operational: ['Building (total_floors, age_years, construction_status, possession_status)', 'Amenities (gym, pool, security, power_backup, lift)', 'Legal (ownership_type, rera_registered, rera_number, title_clear)', 'Preferences (preferred_tenant, pets_allowed, available_from)'],
        advanced: ['Nearby (school_distance_km, hospital_distance_km, metro_distance_km)', 'Features (facing_direction, vastu_compliant, view_type)', 'Media (floor_plan, virtual_tour_url, video_tour)', 'Performance (days_on_market, views_count, inquiries_count)'],
    },
    automotive: {
        essential: ['Identity (brand, model, variant, registration_number, vin)', 'Pricing (asking_price, on_road_price, emi_available)', 'Specs (fuel_type, transmission, engine_cc, mileage_kmpl)', 'Condition (odometer_km, owners_count, service_history, accidents)', 'Availability (available_immediately, test_drive_available)'],
        operational: ['Features (seating_capacity, airbags_count, abs, power_steering)', 'Exterior (body_color, sunroof, alloy_wheels, led_headlights)', 'Interior (leather_seats, touchscreen, apple_carplay, rear_ac)', 'Documents (rc_available, insurance_valid_until, puc_valid)'],
        advanced: ['Safety (traction_control, parking_sensors, camera_360, adas)', 'Warranty (warranty_available, warranty_months, amc_available)', 'Certification (certified_pre_owned, inspection_score)', 'Performance (average_rating, review_count, inquiries)'],
    },
};

const COMPREHENSIVE_FIELD_TYPES = `
FIELD TYPES:
- text: Short text (names, codes) - single line
- textarea: Long text (descriptions) - multi-line
- number: Numeric (quantities, dimensions)
- currency: Money values
- select: Single choice (provide 4-8 options)
- multi_select: Multiple choices (provide 5-12 options)
- toggle: Boolean yes/no
- tags: Freeform tags
- date: Dates
- time: Times
- duration: Minutes
- url: Links
- email: Emails
- phone: Phone numbers
- image: Image upload
`;

export async function generateIntegrationMappingAction(
    integrationName: string,
    industryId: string,
    sampleApiResponse?: Record<string, any>,
    apiDocumentation?: string
): Promise<{
    success: boolean;
    config?: IntegrationConfig;
    error?: string;
}> {
    try {
        const existingIntegrations = Object.keys(INTEGRATION_CONFIGS).join(', ');
        const sampleContext = sampleApiResponse ? `\nSAMPLE API RESPONSE:\n${JSON.stringify(sampleApiResponse, null, 2).slice(0, 3000)}` : '';
        const docsContext = apiDocumentation ? `\nAPI DOCUMENTATION:\n${apiDocumentation.slice(0, 2000)}` : '';

        const prompt = `You are an API integration expert. Generate a COMPREHENSIVE field mapping configuration for integrating "${integrationName}" with a ${industryId} business platform.

EXISTING INTEGRATIONS FOR REFERENCE: ${existingIntegrations}
${sampleContext}
${docsContext}

Generate a complete IntegrationConfig JSON with:
1. AT LEAST 30-50 field mappings covering ALL standard API fields
2. Reverse mappings for export functionality
3. Data transformations needed (html_to_text, string_to_number, cents_to_currency, comma_separated_to_array, etc.)
4. Webhook events if this is a typical integration
5. Auth type and rate limits

FIELD MAPPING RULES:
- Map source API fields to our standard field names (snake_case)
- Use dot notation for nested fields: "variants[0].price" -> "price"
- Include ALL typical fields for ${industryId} industry
- Cover: identification, pricing, inventory, media, metadata, timestamps, variants

OUR STANDARD FIELDS for ${industryId}:
- Core: name, description, short_description, category, status, main_image, images, tags, is_featured, is_active, sort_order
- Integration: external_id, external_source, external_url, last_synced_at, sync_enabled, sync_direction
- Plus industry-specific fields

RESPOND WITH ONLY VALID JSON:
{
  "id": "integration_id_lowercase",
  "name": "${integrationName}",
  "industry": ["${industryId}"],
  "apiType": "rest",
  "documentationUrl": "https://...",
  "supportedOperations": ["import", "export", "sync", "webhook"],
  "authType": "oauth2",
  "rateLimit": { "requests": 60, "period": "minute" },
  "webhookEvents": ["event.created", "event.updated"],
  "fieldMappings": {
    "source_api_field": "our_target_field",
    "nested.field.path": "flattened_field",
    "array[0].field": "array_field"
  },
  "reverseFieldMappings": {
    "our_field": "source_api_field"
  },
  "transformations": {
    "field_name": "transformation_type"
  }
}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 16000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');
        const parsed = cleanAndParseJSON(text) as IntegrationConfig;

        console.log(`✅ AI Generated integration mapping for ${integrationName}: ${Object.keys(parsed.fieldMappings || {}).length} field mappings`);

        return {
            success: true,
            config: parsed,
        };
    } catch (error) {
        console.error('Integration mapping generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Generation failed',
        };
    }
}

export async function analyzeApiResponseAction(
    integrationName: string,
    sampleResponse: Record<string, any>,
    targetIndustry: string
): Promise<{
    success: boolean;
    analysis?: {
        detectedFields: Array<{
            sourcePath: string;
            suggestedTargetField: string;
            dataType: string;
            sampleValue: any;
            confidence: number;
        }>;
        suggestedMappings: Record<string, string>;
        unmappableFields: string[];
        recommendations: string[];
    };
    error?: string;
}> {
    try {
        const prompt = `Analyze this API response from "${integrationName}" and generate comprehensive field mappings for a ${targetIndustry} module.

API RESPONSE (analyze every field):
${JSON.stringify(sampleResponse, null, 2).slice(0, 4000)}

For EVERY field in the response:
1. Identify the full path (e.g., "data.product.title", "items[0].variants[0].price")
2. Suggest the best snake_case target field name
3. Identify data type (string, number, boolean, array, object, date, url, email, phone, currency)
4. Sample value
5. Confidence score (0-1)

RESPOND WITH VALID JSON:
{
  "detectedFields": [
    {"sourcePath": "path.to.field", "suggestedTargetField": "our_field_name", "dataType": "string", "sampleValue": "example", "confidence": 0.95}
  ],
  "suggestedMappings": {"source_path": "target_field"},
  "unmappableFields": ["internal_field_1"],
  "recommendations": ["Add X field for better integration", "Y field needs html_to_text transformation"]
}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 16000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');
        const parsed = cleanAndParseJSON(text);

        console.log(`✅ AI Analyzed API response: ${parsed.detectedFields?.length || 0} fields detected`);

        return {
            success: true,
            analysis: parsed,
        };
    } catch (error) {
        console.error('API analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed',
        };
    }
}

export async function suggestAdditionalMappingsAction(
    integrationId: string,
    existingMappings: Record<string, string>,
    sampleData?: Record<string, any>
): Promise<{
    success: boolean;
    suggestions?: Array<{
        sourceField: string;
        targetField: string;
        reason: string;
        confidence: number;
    }>;
    error?: string;
}> {
    try {
        const existingConfig = INTEGRATION_CONFIGS[integrationId];
        const existingMappingsList = Object.entries(existingMappings).map(([k, v]) => `${k} -> ${v}`).join('\n');
        const sampleContext = sampleData ? `\nSAMPLE DATA:\n${JSON.stringify(sampleData, null, 2).slice(0, 2000)}` : '';

        const prompt = `You are an API integration expert. Suggest ADDITIONAL field mappings for the ${existingConfig?.name || integrationId} integration.

EXISTING MAPPINGS:
${existingMappingsList}
${sampleContext}

Suggest 10-20 additional field mappings that are commonly used in ${existingConfig?.industry?.join(', ') || 'business'} integrations but are missing from the current mapping.

Consider:
- SEO fields (meta_title, meta_description, url_slug)
- Analytics fields (views, clicks, conversions)
- Audit fields (created_by, updated_by, version)
- Custom fields / metafields
- Variant-specific fields
- Pricing tiers and bulk pricing
- Inventory locations
- Shipping details
- Tax configurations

RESPOND WITH VALID JSON:
{
  "suggestions": [
    {"sourceField": "source.path", "targetField": "our_field", "reason": "Why this mapping is useful", "confidence": 0.9}
  ]
}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 8000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });
        const parsed = cleanAndParseJSON(
            response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map(block => block.text)
                .join('')
        );

        return {
            success: true,
            suggestions: parsed.suggestions || [],
        };
    } catch (error) {
        console.error('Mapping suggestion error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed',
        };
    }
}

export async function generateModuleSchemaAction(
    industryId: string,
    industryName: string,
    moduleName: string,
    itemLabel: string,
    countryCode: string = 'IN',
    complexity: SchemaComplexity = 'standard',
    functionId?: string,
    functionName?: string
): Promise<{
    success: boolean;
    schema?: ModuleSchema;
    suggestedItems?: any[];
    integrationMappings?: Record<string, IntegrationConfig>;
    supportedIntegrations?: string[];
    error?: string;
}> {
    try {
        const config = SCHEMA_CONFIG[complexity];

        const fieldGroups = INDUSTRY_FIELD_GROUPS[industryId] || INDUSTRY_FIELD_GROUPS['services'];

        let fieldGroupsText = '';
        if (complexity === 'minimal') {
            fieldGroupsText = fieldGroups.essential.map((g, i) => `${i + 1}. ${g}`).join('\n');
        } else if (complexity === 'standard') {
            fieldGroupsText = [...fieldGroups.essential, ...fieldGroups.operational].map((g, i) => `${i + 1}. ${g}`).join('\n');
        } else {
            fieldGroupsText = [...fieldGroups.essential, ...fieldGroups.operational, ...fieldGroups.advanced].map((g, i) => `${i + 1}. ${g}`).join('\n');
        }

        const relevantIntegrations = getRelevantIntegrations(industryId);

        const prompt = `Generate a ${complexity.toUpperCase()} module schema for "${moduleName}" for ${functionName ? `${functionName} (${industryName})` : industryName} businesses in ${countryCode}.
${functionName ? `\nBUSINESS TYPE CONTEXT: This module is specifically for "${functionName}" businesses, NOT generic "${industryName}". Every field, category, and sample item must be relevant to how a real ${functionName} business operates. Think about what makes ${functionName} DIFFERENT from other ${industryName} sub-categories.\n` : ''}
Generate ${config.minFields}-${config.maxFields} fields. Include fields compatible with: ${relevantIntegrations.join(', ')}.

FIELD GROUPS:
${fieldGroupsText}

SKIP THESE CORE FIELDS (pre-included):
name, description, short_description, category, status, main_image, images, tags, is_featured, is_active, sort_order, internal_notes, external_id, external_source, external_url, last_synced_at, sync_enabled, sync_direction

${COMPREHENSIVE_FIELD_TYPES}

CRITICAL: Be EXHAUSTIVE. Generate every possible field and category a real ${moduleName} ${functionName ? functionName : ''} business in ${countryCode} would need. Think like a domain expert who has built software for 100+ businesses in this industry. Include:
- Every variation of pricing (base, bulk, seasonal, member, wholesale)
- Every operational attribute (prep time, shelf life, storage, handling)
- Every compliance field (licenses, certifications, allergens, safety)
- Every customer-facing attribute (ratings, reviews, popularity, tags)
- Every internal attribute (cost price, supplier, reorder level, margin)
- Categories should represent ALL sub-segments, not just top-level groupings

Generate JSON:
{
  "fields": [{"id": "snake_case", "name": "Display Name", "type": "type", "description": "help", "isRequired": false, "isSearchable": true, "showInList": false, "showInCard": false, "options": []}],
  "categories": [{"id": "snake_case", "name": "Name", "icon": "emoji", "description": "desc", "color": "blue"}],
  "suggestedItems": [{"name": "Item", "description": "desc", "category": "cat_id", "price": 1000, "fields": {}}]
}

Use ${countryCode === 'IN' ? 'INR' : 'USD'} for prices. RESPOND WITH ONLY VALID JSON.`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 16000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');
        const parsed = cleanAndParseJSON(text);

        const coreFields = [...CORE_FIELDS.all, ...CORE_FIELDS.integration];
        const coreFieldIds = coreFields.map(f => f.id);

        const aiFields = (parsed.fields || [])
            .filter((f: any) => !coreFieldIds.includes(f.id))
            .map((f: any, i: number) => ({
                id: f.id || generateFieldId(),
                name: f.name || 'Field',
                type: f.type || 'text',
                description: f.description || '',
                isRequired: f.isRequired ?? false,
                isSearchable: f.isSearchable ?? true,
                showInList: f.showInList ?? (i < 8),
                showInCard: f.showInCard ?? (i < 4),
                placeholder: f.placeholder,
                options: f.options,
                order: coreFields.length + i + 1,
            })) as ModuleFieldDefinition[];

        const schema: ModuleSchema = {
            fields: [...coreFields.map((f, i) => ({ ...f, order: i + 1 })), ...aiFields],
            categories: (parsed.categories || []).map((c: any, i: number) => ({
                id: c.id || generateCategoryId(),
                name: c.name || 'Category',
                icon: c.icon || '📁',
                description: c.description || '',
                color: c.color || 'slate',
                order: i + 1,
            })) as ModuleCategoryDefinition[],
        };

        const integrationMappings = getIntegrationConfigsForIndustry(industryId);

        console.log(`✅ Generated ${complexity} schema: ${schema.fields.length} fields, ${schema.categories.length} categories, ${Object.keys(integrationMappings).length} integrations`);

        return {
            success: true,
            schema,
            suggestedItems: parsed.suggestedItems || [],
            integrationMappings,
            supportedIntegrations: relevantIntegrations,
        };
    } catch (error) {
        console.error('Schema generation error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
    }
}

function getRelevantIntegrations(industryId: string): string[] {
    const integrations: string[] = [];
    for (const [id, config] of Object.entries(INTEGRATION_CONFIGS)) {
        if (config.industry.includes(industryId)) {
            integrations.push(config.name);
        }
    }
    return integrations;
}

function getIntegrationConfigsForIndustry(industryId: string): Record<string, IntegrationConfig> {
    const configs: Record<string, IntegrationConfig> = {};
    for (const [id, config] of Object.entries(INTEGRATION_CONFIGS)) {
        if (config.industry.includes(industryId)) {
            configs[id] = config;
        }
    }
    return configs;
}

export async function getIntegrationConfigAction(integrationId: string): Promise<{
    success: boolean;
    config?: IntegrationConfig;
    error?: string;
}> {
    const config = INTEGRATION_CONFIGS[integrationId];
    if (!config) {
        return { success: false, error: `Integration not found: ${integrationId}. Use generateIntegrationMappingAction to create a new mapping.` };
    }
    return { success: true, config };
}

export async function listIntegrationsAction(industryId?: string): Promise<{
    success: boolean;
    integrations: Array<{ id: string; name: string; industries: string[]; operations: string[]; fieldCount: number }>;
}> {
    const integrations = Object.entries(INTEGRATION_CONFIGS)
        .filter(([_, config]) => !industryId || config.industry.includes(industryId))
        .map(([id, config]) => ({
            id,
            name: config.name,
            industries: config.industry,
            operations: config.supportedOperations,
            fieldCount: Object.keys(config.fieldMappings).length,
        }));

    return { success: true, integrations };
}

export async function mapImportDataAction(
    integrationId: string,
    sourceData: Record<string, any>,
    options?: { applyTransformations?: boolean; includeUnmapped?: boolean }
): Promise<{
    success: boolean;
    mappedData?: Record<string, any>;
    unmappedFields?: string[];
    transformationsApplied?: string[];
    error?: string;
}> {
    const config = INTEGRATION_CONFIGS[integrationId];
    if (!config) {
        return { success: false, error: `Integration not found: ${integrationId}` };
    }

    const mappedData: Record<string, any> = {};
    const unmappedFields: string[] = [];
    const transformationsApplied: string[] = [];

    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => {
            if (current === null || current === undefined) return undefined;
            const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
            if (arrayMatch) {
                const [, arrayKey, index] = arrayMatch;
                return current[arrayKey]?.[parseInt(index)];
            }
            return current[key];
        }, obj);
    };

    const applyTransformation = (value: any, transformType: string): any => {
        switch (transformType) {
            case 'html_to_text':
                return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value;
            case 'comma_separated_to_array':
                return typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : value;
            case 'array_to_comma_separated':
                return Array.isArray(value) ? value.join(', ') : value;
            case 'string_to_number':
                return typeof value === 'string' ? parseFloat(value) || 0 : value;
            case 'number_to_string':
                return typeof value === 'number' ? String(value) : value;
            case 'cents_to_currency':
                return typeof value === 'number' ? value / 100 : value;
            case 'currency_to_cents':
                return typeof value === 'number' ? Math.round(value * 100) : value;
            case 'boolean_to_string':
                return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
            case 'string_to_boolean':
                return value === 'true' || value === '1' || value === 'yes' || value === 'Yes';
            case 'number_to_boolean':
                return Boolean(value);
            case 'date_iso_to_local':
                return value ? new Date(value).toLocaleDateString() : value;
            default:
                return value;
        }
    };

    for (const [sourcePath, targetField] of Object.entries(config.fieldMappings)) {
        const value = getNestedValue(sourceData, sourcePath);
        if (value !== undefined) {
            let finalValue = value;
            if (options?.applyTransformations !== false && config.transformations?.[targetField]) {
                finalValue = applyTransformation(value, config.transformations[targetField]);
                transformationsApplied.push(`${targetField}: ${config.transformations[targetField]}`);
            }
            mappedData[targetField] = finalValue;
        }
    }

    if (options?.includeUnmapped) {
        const flattenObject = (obj: any, prefix = ''): string[] => {
            const keys: string[] = [];
            for (const key in obj) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    keys.push(...flattenObject(obj[key], fullKey));
                } else {
                    keys.push(fullKey);
                }
            }
            return keys;
        };
        const allSourceKeys = flattenObject(sourceData);
        const mappedKeys = Object.keys(config.fieldMappings);
        unmappedFields.push(...allSourceKeys.filter(k => !mappedKeys.includes(k)));
    }

    mappedData.external_source = config.name;
    mappedData.last_synced_at = new Date().toISOString();

    return { success: true, mappedData, unmappedFields, transformationsApplied };
}

export async function mapExportDataAction(
    integrationId: string,
    localData: Record<string, any>
): Promise<{
    success: boolean;
    exportData?: Record<string, any>;
    error?: string;
}> {
    const config = INTEGRATION_CONFIGS[integrationId];
    if (!config) {
        return { success: false, error: `Integration not found: ${integrationId}` };
    }

    if (!config.reverseFieldMappings) {
        return { success: false, error: `Export not supported for: ${integrationId}` };
    }

    const exportData: Record<string, any> = {};
    for (const [localField, targetPath] of Object.entries(config.reverseFieldMappings)) {
        if (localData[localField] !== undefined) {
            exportData[targetPath] = localData[localField];
        }
    }

    return { success: true, exportData };
}

export async function regenerateSchemaFieldsAction(
    currentSchema: ModuleSchema,
    industryId: string,
    industryName: string,
    moduleName: string,
    focusAreas?: string[],
    countryCode: string = 'IN'
): Promise<{
    success: boolean;
    schema?: ModuleSchema;
    addedFields?: string[];
    error?: string;
}> {
    try {
        const existingFieldIds = currentSchema.fields.map(f => f.id);
        const existingFieldNames = currentSchema.fields.map(f => f.name).join(', ');

        const focusText = focusAreas?.length
            ? `FOCUS ON: ${focusAreas.join(', ')}`
            : 'Add fields for: customer experience, operations, compliance, analytics, integrations';

        const prompt = `Expand schema for "${moduleName}" in ${industryName}.

EXISTING (${currentSchema.fields.length}): ${existingFieldNames}

TASK: ${focusText}

Generate 15-25 NEW fields. Do NOT duplicate.

${COMPREHENSIVE_FIELD_TYPES}

RESPOND WITH ONLY JSON:
{"newFields": [...], "newCategories": [...]}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 8000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');
        const parsed = cleanAndParseJSON(text);

        const newFields = (parsed.newFields || [])
            .filter((f: any) => !existingFieldIds.includes(f.id))
            .map((f: any, i: number) => ({
                id: f.id || generateFieldId(),
                name: f.name || 'Field',
                type: f.type || 'text',
                description: f.description || '',
                isRequired: f.isRequired ?? false,
                isSearchable: f.isSearchable ?? true,
                showInList: f.showInList ?? false,
                showInCard: f.showInCard ?? false,
                placeholder: f.placeholder,
                options: f.options,
                order: currentSchema.fields.length + i + 1,
            })) as ModuleFieldDefinition[];

        const existingCategoryIds = currentSchema.categories.map(c => c.id);
        const newCategories = (parsed.newCategories || [])
            .filter((c: any) => !existingCategoryIds.includes(c.id))
            .map((c: any, i: number) => ({
                id: c.id || generateCategoryId(),
                name: c.name || 'Category',
                icon: c.icon || '📁',
                description: c.description || '',
                color: c.color || 'slate',
                order: currentSchema.categories.length + i + 1,
            })) as ModuleCategoryDefinition[];

        return {
            success: true,
            schema: {
                fields: [...currentSchema.fields, ...newFields],
                categories: [...currentSchema.categories, ...newCategories],
            },
            addedFields: newFields.map(f => f.name),
        };
    } catch (error) {
        console.error('Schema expansion error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Expansion failed' };
    }
}

export async function generateFieldSuggestionsAction(
    industryId: string,
    industryName: string,
    moduleName: string,
    existingFieldNames: string[],
    count: number = 10
): Promise<{
    success: boolean;
    suggestions?: Array<{ name: string; type: string; description: string; rationale: string }>;
    error?: string;
}> {
    try {
        const prompt = `Suggest ${count} fields for "${moduleName}" in ${industryName}.

EXISTING: ${existingFieldNames.join(', ')}

Suggest NEW fields with: name, type, description, rationale.

RESPOND WITH ONLY JSON:
{"suggestions": [{"name": "...", "type": "...", "description": "...", "rationale": "..."}]}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 4000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });
        const parsed = cleanAndParseJSON(
            response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map(block => block.text)
                .join('')
        );

        return { success: true, suggestions: parsed.suggestions || [] };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
}

function getIndustryColor(industryId: string): string {
    const colors: Record<string, string> = {
        hospitality: 'blue', food_beverage: 'orange', retail: 'emerald', healthcare: 'red',
        education: 'purple', services: 'indigo', real_estate: 'teal', automotive: 'slate',
    };
    return colors[industryId] || 'blue';
}

export async function bulkGenerateModulesAction(
    config?: { industryIds?: string[]; countryCode?: string; complexity?: SchemaComplexity },
    userId: string = 'system'
): Promise<{
    success: boolean;
    generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number; integrationsCount: number }[];
    failed: { slug: string; name: string; error: string }[];
    totalTime: number;
}> {
    const startTime = Date.now();
    const generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number; integrationsCount: number }[] = [];
    const failed: { slug: string; name: string; error: string }[] = [];
    const countryCode = config?.countryCode || 'IN';
    const complexity = config?.complexity || 'standard';

    const industries = config?.industryIds
        ? BULK_INDUSTRY_CONFIGS.filter(i => config.industryIds!.includes(i.id))
        : BULK_INDUSTRY_CONFIGS;

    for (const industry of industries) {
        for (const moduleConfig of industry.modules) {
            try {
                const existing = await getSystemModuleAction(moduleConfig.slug);
                if (existing.success && existing.data) {
                    generated.push({
                        slug: moduleConfig.slug,
                        name: moduleConfig.name,
                        fieldsCount: existing.data.schema.fields.length,
                        categoriesCount: existing.data.schema.categories.length,
                        integrationsCount: getRelevantIntegrations(industry.id).length,
                    });
                    continue;
                }

                const schemaResult = await generateModuleSchemaAction(
                    industry.id, industry.name, moduleConfig.name, moduleConfig.itemLabel, countryCode, complexity
                );

                if (!schemaResult.success || !schemaResult.schema) {
                    throw new Error(schemaResult.error || 'Schema generation failed');
                }

                const createResult = await createSystemModuleAction({
                    slug: moduleConfig.slug,
                    name: moduleConfig.name,
                    description: `${moduleConfig.name} for ${industry.name} businesses`,
                    icon: industry.icon,
                    color: getIndustryColor(industry.id),
                    itemLabel: moduleConfig.itemLabel,
                    itemLabelPlural: moduleConfig.itemLabel + 's',
                    priceLabel: 'Price',
                    priceType: moduleConfig.priceType as any,
                    defaultCurrency: countryCode === 'IN' ? 'INR' : 'USD',
                    applicableIndustries: [industry.id],
                    applicableFunctions: [],
                    status: 'active',
                    settings: DEFAULT_MODULE_SETTINGS,
                    schema: schemaResult.schema,
                    createdBy: userId,
                });

                if (!createResult.success) {
                    throw new Error(createResult.error || 'Module creation failed');
                }

                generated.push({
                    slug: moduleConfig.slug,
                    name: moduleConfig.name,
                    fieldsCount: schemaResult.schema.fields.length,
                    categoriesCount: schemaResult.schema.categories.length,
                    integrationsCount: schemaResult.supportedIntegrations?.length || 0,
                });

                console.log(`✅ Generated ${moduleConfig.name}: ${schemaResult.schema.fields.length} fields, ${schemaResult.supportedIntegrations?.length || 0} integrations`);

            } catch (error) {
                console.error(`❌ Failed: ${moduleConfig.slug}`, error);
                failed.push({ slug: moduleConfig.slug, name: moduleConfig.name, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
    }

    console.log(`📊 Bulk: ${generated.length} succeeded, ${failed.length} failed in ${Date.now() - startTime}ms`);
    return { success: failed.length === 0, generated, failed, totalTime: Date.now() - startTime };
}

// ============================================================================
// MODULE DISCOVERY (AI discovers modules for a business function)
// ============================================================================

const VALID_PRICE_TYPES: ModulePriceType[] = [
    'one_time', 'per_night', 'per_hour', 'per_session',
    'per_day', 'per_week', 'per_month', 'per_year', 'custom'
];

export async function discoverModulesForBusinessType(
    industryId: string,
    industryName: string,
    functionId: string,
    functionName: string,
    countryCode: string = 'IN'
): Promise<{
    success: boolean;
    template?: ModuleDiscoveryTemplate;
    error?: string;
}> {
    try {
        // Check for cached template first
        const templateId = `${industryId}_${functionId}`;
        const templateDoc = await adminDb.collection('systemModuleTemplates').doc(templateId).get();

        if (templateDoc.exists) {
            const cached = templateDoc.data() as ModuleDiscoveryTemplate;
            return { success: true, template: cached };
        }

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: `You are a business module architect. Discover all the inventory/catalog modules that a "${functionName}" business (within the "${industryName}" industry) would need to manage.

Country context: ${countryCode}

For each module, provide:
- name: Human-readable module name (e.g. "Room Types", "Menu Items")
- slug: URL-safe lowercase identifier (e.g. "room-types", "menu-items")
- description: One-line description of what this module manages
- icon: A single emoji that represents this module
- itemLabel: Singular label for one item (e.g. "Room", "Dish")
- itemLabelPlural: Plural label (e.g. "Rooms", "Dishes")
- priceType: One of: ${VALID_PRICE_TYPES.join(', ')}
- priceLabel: Label for the price field (e.g. "Price per Night", "Menu Price")
- estimatedFieldCount: How many fields this module would need (15-80)
- agentConfig: AI agent configuration with:
  - relayBlockType: "card" | "list" | "carousel" (how the chat widget renders items)
  - displayFields: array of field IDs to show in chat widget (use descriptive IDs like "room_type", "cuisine_type")
  - cardTitle: field ID or template for card title (e.g. "name" or "{name} - {location}")
  - cardSubtitle: field ID or template for card subtitle
  - cardPrice: field ID for price display (e.g. "price")
  - cardImage: field ID for image (e.g. "main_image")
  - comparisonFields: field IDs useful for comparing items
  - searchableFields: field IDs that AI should search through
  - broadcastVariables: field IDs available as WhatsApp broadcast variables
  - inboxContext: template string describing how to summarize items for inbox AI (e.g. "This {itemLabel} is priced at {price} and features {key_features}")

Think about what makes "${functionName}" DIFFERENT from other "${industryName}" sub-categories. Generate modules specific to this business type.

Respond with ONLY a JSON array of module objects. No markdown, no explanation.`
            }],
        });

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');

        const modules = cleanAndParseJSON(text) as DiscoveredModule[];

        if (!Array.isArray(modules) || modules.length === 0) {
            throw new Error('AI returned invalid or empty module list');
        }

        // Validate and sanitize each module
        const validatedModules: DiscoveredModule[] = modules.map(m => ({
            name: m.name,
            slug: m.slug,
            description: m.description,
            icon: m.icon || '📦',
            itemLabel: m.itemLabel,
            itemLabelPlural: m.itemLabelPlural,
            priceType: VALID_PRICE_TYPES.includes(m.priceType) ? m.priceType : 'one_time',
            priceLabel: m.priceLabel || 'Price',
            estimatedFieldCount: Math.max(15, Math.min(80, m.estimatedFieldCount || 30)),
            agentConfig: {
                relayBlockType: m.agentConfig?.relayBlockType || 'card',
                displayFields: m.agentConfig?.displayFields || [],
                cardTitle: m.agentConfig?.cardTitle || 'name',
                cardSubtitle: m.agentConfig?.cardSubtitle,
                cardPrice: m.agentConfig?.cardPrice || 'price',
                cardImage: m.agentConfig?.cardImage || 'main_image',
                comparisonFields: m.agentConfig?.comparisonFields || [],
                searchableFields: m.agentConfig?.searchableFields || [],
                broadcastVariables: m.agentConfig?.broadcastVariables || [],
                inboxContext: m.agentConfig?.inboxContext || `A ${m.itemLabel} from ${functionName}`,
            },
            selected: true,
        }));

        const template: ModuleDiscoveryTemplate = {
            id: templateId,
            industryId,
            functionId,
            industryName,
            functionName,
            modules: validatedModules,
            generatedAt: new Date().toISOString(),
            generatedBy: 'ai',
        };

        // Cache to Firestore
        await adminDb.collection('systemModuleTemplates').doc(templateId).set(template);

        return { success: true, template };
    } catch (error) {
        console.error('Module discovery failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Discovery failed',
        };
    }
}

export async function regenerateModuleTemplate(
    industryId: string,
    industryName: string,
    functionId: string,
    functionName: string,
    countryCode: string = 'IN'
): Promise<{
    success: boolean;
    template?: ModuleDiscoveryTemplate;
    error?: string;
}> {
    // Delete cached template and regenerate
    const templateId = `${industryId}_${functionId}`;
    try {
        await adminDb.collection('systemModuleTemplates').doc(templateId).delete();
    } catch {
        // Ignore delete errors
    }
    return discoverModulesForBusinessType(industryId, industryName, functionId, functionName, countryCode);
}

export async function getModuleTemplate(
    industryId: string,
    functionId: string
): Promise<{
    success: boolean;
    template?: ModuleDiscoveryTemplate;
    error?: string;
}> {
    try {
        const templateId = `${industryId}_${functionId}`;
        const doc = await adminDb.collection('systemModuleTemplates').doc(templateId).get();

        if (!doc.exists) {
            return { success: false, error: 'Template not found' };
        }

        return { success: true, template: doc.data() as ModuleDiscoveryTemplate };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get template',
        };
    }
}