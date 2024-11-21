/**
 * @module @metalsmith/blog-pages
 * @description Metalsmith plugin that generates paginated blog landing pages from a main blog template
 */

/**
 * Custom error class for blog pages plugin
 * @extends Error
 */
class BlogPagesError extends Error {
  constructor( message ) {
    super( message );
    this.name = 'BlogPagesError';
  }
}

/**
 * @typedef Options
 * @property {Number} pagesPerPage - Number of blog posts to display per page
 * @property {String} blogDirectory - Directory containing blog post files
 */

/** @type {Options} */
const defaults = {
  pagesPerPage: 6,
  blogDirectory: "blog/"
};

/**
 * Validate plugin options
 * @param {Options} options - Plugin configuration options
 * @throws {BlogPagesError} If options are invalid
 * @private
 */
function validateOptions( options ) {
  if ( options.pagesPerPage <= 0 ) {
    throw new BlogPagesError( 'pagesPerPage must be greater than 0' );
  }
  if ( typeof options.blogDirectory !== 'string' ) {
    throw new BlogPagesError( 'blogDirectory must be a string' );
  }
}

/**
 * Validate required files and structure
 * @param {Object} files - Metalsmith files object
 * @throws {BlogPagesError} If required files or structure is missing
 * @private
 */
function validateFiles( files ) {
  if ( !files[ 'blog.md' ] ) {
    throw new BlogPagesError( 'blog.md template file is required' );
  }
  if ( !files[ 'blog.md' ].sections?.some( s => s.hasPagingParams ) ) {
    throw new BlogPagesError( 'blog.md must contain a section with hasPagingParams: true' );
  }
}

/**
 * Recursively update nested object property
 * @param {Object} obj - Target object to traverse and update
 * @param {String} key - Property name to search for and update
 * @param {*} value - New value to assign when property is found
 * @private
 */
function updateProperty( obj, key, value ) {
  Object.keys( obj ).forEach( k => {
    if ( k === key ) obj[ k ] = value;
    if ( typeof obj[ k ] === 'object' && obj[ k ] !== null ) {
      updateProperty( obj[ k ], key, value );
    }
  } );
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
function updatePagination( section, { total, pages, pageSize, start, current } ) {
  if ( !section ) return;

  const updates = {
    numberOfBlogs: total,
    numberOfPages: pages,
    pageLength: pageSize,
    pageStart: start,
    pageNumber: current
  };

  Object.entries( updates ).forEach( ( [ key, value ] ) => {
    updateProperty( section, key, value );
  } );
}

/**
 * A Metalsmith plugin to generate paginated blog landing pages
 * Creates additional pages when the number of blog posts exceeds the pagesPerPage option.
 * Updates pagination parameters in sections marked with hasPagingParams: true
 *
 * @param {Options} [options] - Plugin configuration options
 * @returns {import('metalsmith').Plugin} - Metalsmith plugin function
 * @example
 * metalsmith.use(blogPages({
 *   pagesPerPage: 10,
 *   blogDirectory: "posts/"
 * }))
 */
export default function blogPages( options = {} ) {
  const opts = { ...defaults, ...options };

  /**
   * Plugin function that processes files
   * @param {Object} files - Metalsmith files object
   * @param {Object} metalsmith - Metalsmith instance
   * @param {Function} done - Callback function
   */
  return function( files, metalsmith, done ) {
    try {
      validateOptions( opts );
      validateFiles( files );

      const debug = metalsmith.debug( 'blogPages' );
      debug( 'Running with options: %O', opts );

      // Get list of blog posts from specified directory
      const posts = Object.keys( files ).filter( file =>
        file.startsWith( opts.blogDirectory )
      );

      if ( posts.length === 0 ) {
        debug( 'No blog posts found in %s', opts.blogDirectory );
        return done();
      }

      // Calculate total pages needed
      const totalPages = Math.ceil( posts.length / opts.pagesPerPage );
      if ( totalPages <= 1 ) return done();

      // Update main blog page
      const mainBlog = files[ "blog.md" ];
      const pagingSection = mainBlog.sections.find( s => s.hasPagingParams );

      updatePagination( pagingSection, {
        total: posts.length,
        pages: totalPages,
        pageSize: opts.pagesPerPage,
        start: 0,
        current: 1
      } );

      // Generate additional pages
      for ( let page = 2; page <= totalPages; page++ ) {
        try {
          const pagePath = `blog/${ page }.md`;
          const pageContent = JSON.parse( JSON.stringify( mainBlog ) );
          const section = pageContent.sections.find( s => s.hasPagingParams );

          updatePagination( section, {
            total: posts.length,
            pages: totalPages,
            pageSize: opts.pagesPerPage,
            start: ( page - 1 ) * opts.pagesPerPage,
            current: page
          } );

          files[ pagePath ] = pageContent;
        } catch ( err ) {
          throw new BlogPagesError( `Failed to create page ${ page }: ${ err.message }` );
        }
      }

      done();
    } catch ( err ) {
      done( err );
    }
  };
}
