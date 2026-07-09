/**
 * @module metalsmith-sectioned-blog-pagination
 * @description Metalsmith plugin that generates paginated blog landing pages from a main blog template
 * with sections that have pagination parameters.
 */

import { validateOptions, validateFiles } from './utils/validation.js';
import { deepClone } from './utils/clone.js';
import { updatePagination } from './utils/update.js';

/**
 * @typedef {Object} Options
 * @property {number} pagesPerPage - Number of blog posts to display per page
 * @property {string} blogDirectory - Directory containing blog post files (with trailing slash)
 * @property {string} [mainTemplate='blog.md'] - Main blog template file to use as template for pagination
 * @property {string} [collectionName] - Name of the collection to paginate (uses @metalsmith/collections metadata).
 *   When provided, the plugin counts posts from the named collection instead of scanning blogDirectory.
 */

/** @type {Options} */
const defaults = {
  pagesPerPage: 6,
  blogDirectory: 'blog/',
  mainTemplate: 'blog.md',
};

/**
 * A Metalsmith plugin to generate paginated blog landing pages
 * Creates additional pages when the number of blog posts exceeds the pagesPerPage option.
 * Updates pagination parameters in sections marked with hasPagingParams: true
 *
 * @param {Options} [options] - Plugin configuration options
 * @returns {import('metalsmith').Plugin} - Metalsmith plugin function
 */
function blogPages(options = {}) {
  const opts = { ...defaults, ...options };

  // Return the actual plugin function (two-phase pattern)
  // Phase 1: Configuration processing and validation happens here
  // Phase 2: File processing happens in the returned function
  const plugin = function (files, metalsmith, done) {
    try {
      // Validate configuration
      validateOptions(opts);
      validateFiles(files, opts.mainTemplate);

      // Setup debug if available
      const debug = metalsmith.debug
        ? metalsmith.debug('metalsmith-sectioned-blog-pagination')
        : () => {};
      debug('Running with options: %O', opts);

      // Find all blog posts — prefer collection when configured
      let postCount;

      if (opts.collectionName) {
        const collections = metalsmith.metadata().collections || {};
        const collection = collections[opts.collectionName];

        if (!collection) {
          throw new Error(
            `Collection "${opts.collectionName}" not found. Ensure @metalsmith/collections runs before this plugin.`
          );
        }

        postCount = collection.length;
        debug('Using collection "%s" with %d posts', opts.collectionName, postCount);
      } else {
        postCount = Object.keys(files).filter((file) => file.startsWith(opts.blogDirectory)).length;
        debug('Scanning directory "%s", found %d files', opts.blogDirectory, postCount);
      }

      if (postCount === 0) {
        debug('No blog posts found');
        return done();
      }

      // Calculate pagination
      const totalPages = Math.ceil(postCount / opts.pagesPerPage);
      debug('Found %d posts, creating %d pages', postCount, totalPages);

      // Skip if only one page is needed
      if (totalPages <= 1) {
        debug('Only one page needed, skipping pagination');
        return done();
      }

      // Update main blog page
      const mainBlog = files[opts.mainTemplate];
      const pagingSection = mainBlog.sections.find((s) => s.hasPagingParams);

      updatePagination(pagingSection, {
        total: postCount,
        pages: totalPages,
        pageSize: opts.pagesPerPage,
        start: 0,
        current: 1,
      });

      debug('Updated main template %s with pagination parameters', opts.mainTemplate);

      // Use configured blog directory for output paths (removes trailing slash if present)
      const blogDir = opts.blogDirectory.replace(/\/$/, '');

      // Generate additional pages
      for (let page = 2; page <= totalPages; page++) {
        try {
          const pagePath = `${blogDir}/${page}.md`;
          // Deep clone the template to avoid reference issues
          const pageContent = deepClone(mainBlog);
          const section = pageContent.sections.find((s) => s.hasPagingParams);

          updatePagination(section, {
            total: postCount,
            pages: totalPages,
            pageSize: opts.pagesPerPage,
            start: (page - 1) * opts.pagesPerPage,
            current: page,
          });

          files[pagePath] = pageContent;
          debug('Created pagination page %s', pagePath);
        } catch (err) {
          throw new Error(`Failed to create page ${page}: ${err.message}`, { cause: err });
        }
      }

      done();
    } catch (err) {
      done(err);
    }
  };

  // Set function name for debugging (helps with stack traces and debugging)
  Object.defineProperty(plugin, 'name', {
    value: 'metalsmith-sectioned-blog-pagination',
    configurable: true,
  });

  return plugin;
}

// ESM export
export default blogPages;
