/**
 * Update utilities for metalsmith-sectioned-blog-pagination
 */

/**
 * Recursively update nested object property
 * Finds all instances of the key in the object tree and updates their values
 *
 * @param {Object} obj - Target object to traverse and update
 * @param {string} key - Property name to search for and update
 * @param {*} value - New value to assign when property is found
 */
export function updateProperty(obj, key, value) {
  // Quick return for non-objects
  if (!obj || typeof obj !== 'object') {
    return;
  }

  Object.keys(obj).forEach((k) => {
    if (k === key) {
      obj[k] = value;
    }

    // Recursively check nested objects but avoid circular references
    if (obj[k] && typeof obj[k] === 'object') {
      updateProperty(obj[k], key, value);
    }
  });
}

/**
 * Update pagination parameters in blog section
 * @param {Object} section - Blog section configuration to update
 * @param {Object} params - Pagination parameters
 * @param {Number} params.total - Total number of blog posts
 * @param {Number} params.pages - Total number of pages
 * @param {Number} params.pageSize - Posts per page
 * @param {Number} params.start - Starting index for current page
 * @param {Number} params.current - Current page number
 */
export function updatePagination(section, { total, pages, pageSize, start, current }) {
  if (!section) {
    return;
  }

  const updates = {
    numberOfBlogs: total,
    numberOfPages: pages,
    pageLength: pageSize,
    pageStart: start,
    pageNumber: current
  };

  Object.entries(updates).forEach(([key, value]) => {
    updateProperty(section, key, value);
  });
}