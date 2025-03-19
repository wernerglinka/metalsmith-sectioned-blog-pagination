/**
 * @module metalsmith-sectioned-blog-pagination
 * @description Metalsmith plugin that generates paginated blog landing pages from a main blog template
 * with sections that have pagination parameters.
 */

/**
 * @typedef {Object} Options
 * @property {number} pagesPerPage - Number of blog posts to display per page
 * @property {string} blogDirectory - Directory containing blog post files (with trailing slash)
 * @property {string} [mainTemplate='blog.md'] - Main blog template file to use as template for pagination
 */

/** @type {Options} */
const defaults = {
  pagesPerPage: 6,
  blogDirectory: 'blog/',
  mainTemplate: 'blog.md'
};

/**
 * Validate plugin options
 * @param {Options} options - Plugin configuration options
 * @throws {Error} If options are invalid
 * @private
 */
function validateOptions(options) {
  if (options.pagesPerPage <= 0) {
    throw new Error('pagesPerPage must be greater than 0');
  }
  if (typeof options.blogDirectory !== 'string') {
    throw new Error('blogDirectory must be a string');
  }
  if (typeof options.mainTemplate !== 'string') {
    throw new Error('mainTemplate must be a string');
  }
}

/**
 * Validate required files and structure
 * @param {Object} files - Metalsmith files object
 * @param {string} mainTemplate - Name of the template file to use
 * @throws {Error} If required files or structure is missing
 * @private
 */
function validateFiles(files, mainTemplate) {
  var _files$mainTemplate$s;
  if (!files[mainTemplate]) {
    throw new Error(`${mainTemplate} template file is required`);
  }
  if (!((_files$mainTemplate$s = files[mainTemplate].sections) != null && _files$mainTemplate$s.some(s => s.hasPagingParams))) {
    throw new Error(`${mainTemplate} must contain a section with hasPagingParams: true`);
  }
}

/**
 * Recursively update nested object property
 * Finds all instances of the key in the object tree and updates their values
 *
 * @param {Object} obj - Target object to traverse and update
 * @param {string} key - Property name to search for and update
 * @param {*} value - New value to assign when property is found
 * @private
 */
function updateProperty(obj, key, value) {
  // Quick return for non-objects
  if (!obj || typeof obj !== 'object') {
    return;
  }
  Object.keys(obj).forEach(k => {
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
 * @private
 */
function updatePagination(section, {
  total,
  pages,
  pageSize,
  start,
  current
}) {
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

/**
 * A Metalsmith plugin to generate paginated blog landing pages
 * Creates additional pages when the number of blog posts exceeds the pagesPerPage option.
 * Updates pagination parameters in sections marked with hasPagingParams: true
 *
 * @param {Options} [options] - Plugin configuration options
 * @returns {import('metalsmith').Plugin} - Metalsmith plugin function
 */
function blogPages(options = {}) {
  const opts = {
    ...defaults,
    ...options
  };
  return function (files, metalsmith, done) {
    try {
      // Validate configuration
      validateOptions(opts);
      validateFiles(files, opts.mainTemplate);

      // Setup debug if available
      const debug = metalsmith.debug ? metalsmith.debug('metalsmith-sectioned-blog-pagination') : () => {};
      debug('Running with options: %O', opts);

      // Find all blog posts
      const posts = Object.keys(files).filter(file => file.startsWith(opts.blogDirectory));
      if (posts.length === 0) {
        debug('No blog posts found in %s', opts.blogDirectory);
        return done();
      }

      // Calculate pagination
      const totalPages = Math.ceil(posts.length / opts.pagesPerPage);
      debug('Found %d posts, creating %d pages', posts.length, totalPages);

      // Skip if only one page is needed
      if (totalPages <= 1) {
        debug('Only one page needed, skipping pagination');
        return done();
      }

      // Update main blog page
      const mainBlog = files[opts.mainTemplate];
      const pagingSection = mainBlog.sections.find(s => s.hasPagingParams);
      updatePagination(pagingSection, {
        total: posts.length,
        pages: totalPages,
        pageSize: opts.pagesPerPage,
        start: 0,
        current: 1
      });
      debug('Updated main template %s with pagination parameters', opts.mainTemplate);

      // For backward compatibility, always use 'blog' for output directory
      const blogDir = 'blog';

      // Generate additional pages
      for (let page = 2; page <= totalPages; page++) {
        try {
          const pagePath = `${blogDir}/${page}.md`;
          // Deep clone the template to avoid reference issues
          const pageContent = JSON.parse(JSON.stringify(mainBlog));
          const section = pageContent.sections.find(s => s.hasPagingParams);
          updatePagination(section, {
            total: posts.length,
            pages: totalPages,
            pageSize: opts.pagesPerPage,
            start: (page - 1) * opts.pagesPerPage,
            current: page
          });
          files[pagePath] = pageContent;
          debug('Created pagination page %s', pagePath);
        } catch (err) {
          throw new Error(`Failed to create page ${page}: ${err.message}`);
        }
      }
      done();
    } catch (err) {
      done(err);
    }
  };
}

// CommonJS export compatibility
if (typeof module !== 'undefined') {
  module.exports = blogPages;
}

export { blogPages as default };
//# sourceMappingURL=index.js.map
