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
 * @returns {boolean} Whether the key was found anywhere in the tree
 */
export function updateProperty(obj, key, value) {
  // Quick return for non-objects
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  let found = false;

  Object.keys(obj).forEach((k) => {
    if (k === key) {
      obj[k] = value;
      found = true;
    }

    // Recursively check nested objects but avoid circular references
    if (obj[k] && typeof obj[k] === 'object') {
      found = updateProperty(obj[k], key, value) || found;
    }
  });

  return found;
}

/**
 * Update pagination parameters in blog section
 *
 * Existing keys are updated in place wherever they live in the section
 * tree, so templates keep working regardless of where their frontmatter
 * declared them. Keys the frontmatter did not declare are created under
 * section.pagingParams, so a bare `hasPagingParams: true` is enough —
 * no placeholder block required.
 *
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

  const missing = Object.entries(updates).filter(([key, value]) => !updateProperty(section, key, value));

  if (missing.length > 0) {
    if (!section.pagingParams || typeof section.pagingParams !== 'object') {
      section.pagingParams = {};
    }
    missing.forEach(([key, value]) => {
      section.pagingParams[key] = value;
    });
  }
}
