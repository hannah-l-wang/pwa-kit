/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Shared utility functions for cache tag generation
 */

/**
 * Adds the global cache tag for bulk invalidation
 * @param {Array} tags - Array to add tags to
 */
const addGlobalTag = (tags) => {
    tags.push('pwa-global')
}

/**
 * Adds context-based cache tags (locale, currency, site, user)
 * @param {Array} tags - Array to add tags to
 * @param {Object} context - Context object with locale, currency, siteId, customerId
 */
const addContextTags = (tags, context = {}) => {
    if (context.locale) {
        tags.push(`locale-${context.locale}`)
    }

    if (context.currency) {
        tags.push(`currency-${context.currency}`)
    }

    if (context.siteId) {
        tags.push(`site-${context.siteId}`)
    }

    // User context tags (without customer ID for better cache efficiency)
    if (context.customerId) {
        tags.push('user-authenticated')
    } else {
        tags.push('user-guest')
    }
}

/**
 * Adds product-specific cache tags
 * @param {Array} tags - Array to add tags to
 * @param {Object} product - Product object
 */
const addProductTags = (tags, product) => {
    if (product?.id) {
        tags.push(`product-${product.id}`)
    }

    // Add master product ID if this is a variant and it's different from the product ID
    if (product?.master?.masterId && product.master.masterId !== product.id) {
        tags.push(`product-${product.master.masterId}`)
    }

    if (product?.brand) {
        tags.push(`brand-${product.brand}`)
    }

    if (product?.type) {
        Object.entries(product.type).forEach(([key, value]) => {
            if (value) {
                tags.push(`type-${key}`)
            }
        })
    }

    if (product?.inventory && Object.keys(product.inventory).length > 0) {
        const availability = getAvailabilityStatus(product.inventory)
        if (availability) {
            tags.push(`availability-${availability}`)
        }
    }
}

/**
 * Adds category-specific cache tags
 * @param {Array} tags - Array to add tags to
 * @param {Object} category - Category object
 * @param {Object} product - Product object (for fallback)
 */
const addCategoryTags = (tags, category = null, product = null) => {
    if (category?.id) {
        tags.push(`category-${category.id}`)
    } else if (product?.primaryCategoryId) {
        tags.push(`category-${product.primaryCategoryId}`)
    }

    if (category?.parentCategoryId) {
        tags.push(`category-${category.parentCategoryId}`)
    }
}

/**
 * Determines availability status based on inventory
 * @param {Object} inventory - Product inventory object
 * @returns {string} Availability status (in-stock, out-of-stock, low-stock)
 */
const getAvailabilityStatus = (inventory) => {
    if (!inventory) return null
    
    // Check if product is in stock
    const stockLevel = inventory.stockLevel || 0
    const ats = inventory.ats || 0
    
    if (stockLevel > 0 || ats > 0) {
        if (stockLevel < 10 || ats < 10) {
            return 'low-stock'
        }
        return 'in-stock'
    }
    
    return 'out-of-stock'
}

/**
 * Main cache tag builder functions for different page types
 */

/**
 * Builds cache tags for product detail pages
 * @param {Object} product - The product object
 * @param {Object} context - Additional context (locale, currency, siteId, etc.)
 * @param {Object} category - The category object (optional)
 * @returns {Array} Array of cache tag strings
 */
export const buildProductCacheTags = (product, context = {}, category = null) => {
    const tags = []

    // Global tag for bulk invalidation
    addGlobalTag(tags)

    // Product-specific tags
    addProductTags(tags, product)

    // Category tags
    addCategoryTags(tags, category, product)

    // Context tags
    addContextTags(tags, context)

    // Page type tag
    tags.push('page-product-detail')

    return tags
}

/**
 * Builds cache tags for category/product list pages
 * @param {Object} category - The category object
 * @param {Object} context - Additional context
 * @returns {Array} Array of cache tag strings
 */
export const buildCategoryCacheTags = (category, context = {}) => {
    const tags = []

    // Global tag for bulk invalidation
    addGlobalTag(tags)

    // Category tags
    addCategoryTags(tags, category)

    // Context tags
    addContextTags(tags, context)

    // Page type tag
    tags.push('page-category')

    return tags
}

/**
 * Builds cache tags for homepage
 * @param {Object} context - Additional context
 * @returns {Array} Array of cache tag strings
 */
export const buildHomepageCacheTags = (context = {}) => {
    const tags = []

    // Global tag for bulk invalidation
    addGlobalTag(tags)

    // Context tags
    addContextTags(tags, context)

    // Page type tag
    tags.push('page-home')

    return tags
}

/**
 * Generic cache tag builder for any page type
 * @param {string} pageType - Type of page (e.g., 'product-detail', 'category', 'home')
 * @param {Object} data - Page-specific data
 * @param {Object} context - Context information
 * @returns {Array} Array of cache tag strings
 */
export const buildCacheTags = (pageType, data = {}, context = {}) => {
    const tags = []

    // Add page-specific tags based on page type
    switch (pageType) {
        case 'product-detail':
            return buildProductCacheTags(data.product, context, data.category)
        case 'category':
            return buildCategoryCacheTags(data.category, context)
        case 'home':
            return buildHomepageCacheTags(context)
        default:
            // No cache tags for unknown page types
            return tags
    }
} 