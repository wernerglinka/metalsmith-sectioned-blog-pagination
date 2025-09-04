/**
 * Validation utilities for metalsmith-sectioned-blog-pagination
 */

/**
 * Validate plugin options
 * @param {Object} options - Plugin configuration options
 * @throws {Error} If options are invalid
 */
export function validateOptions(options) {
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
 */
export function validateFiles(files, mainTemplate) {
  if (!files[mainTemplate]) {
    throw new Error(`${mainTemplate} template file is required`);
  }
  if (!files[mainTemplate].sections?.some((s) => s.hasPagingParams)) {
    throw new Error(`${mainTemplate} must contain a section with hasPagingParams: true`);
  }
}