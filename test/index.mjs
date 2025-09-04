import { expect } from 'chai';
import blogPages from '../src/index.js';

describe( 'blogPages plugin', () => {
  let files, metalsmith;

  beforeEach( () => {
    files = {
      'blog.md': {
        sections: [ {
          hasPagingParams: true,
          numberOfBlogs: 0,
          numberOfPages: 0,
          pageLength: 0,
          pageStart: 0,
          pageNumber: 0
        } ]
      },
      'blog/post1.md': {},
      'blog/post2.md': {},
      'blog/post3.md': {},
      'blog/post4.md': {},
      'blog/post5.md': {},
      'blog/post6.md': {},
      'blog/post7.md': {}
    };

    metalsmith = {
      debug: () => () => { }
    };
  } );

  // Core functionality tests
  it( 'should not create additional pages when posts fit on one page', ( done ) => {
    const plugin = blogPages( { pagesPerPage: 10 } );
    plugin( files, metalsmith, () => {
      expect( Object.keys( files ) ).to.have.length( 8 );
      expect( files[ 'blog/2.md' ] ).to.be.undefined;
      done();
    } );
  } );

  it( 'should create correct number of pages', ( done ) => {
    const plugin = blogPages( { pagesPerPage: 3 } );
    plugin( files, metalsmith, () => {
      expect( Object.keys( files ) ).to.have.length( 10 );
      expect( files[ 'blog/2.md' ] ).to.exist;
      expect( files[ 'blog/3.md' ] ).to.exist;
      done();
    } );
  } );

  it( 'should update pagination params correctly', ( done ) => {
    const plugin = blogPages( { pagesPerPage: 3 } );
    plugin( files, metalsmith, () => {
      const mainPage = files[ 'blog.md' ].sections[ 0 ];
      expect( mainPage.numberOfBlogs ).to.equal( 7 );
      expect( mainPage.numberOfPages ).to.equal( 3 );
      expect( mainPage.pageLength ).to.equal( 3 );
      expect( mainPage.pageStart ).to.equal( 0 );
      expect( mainPage.pageNumber ).to.equal( 1 );

      const page2 = files[ 'blog/2.md' ].sections[ 0 ];
      expect( page2.pageStart ).to.equal( 3 );
      expect( page2.pageNumber ).to.equal( 2 );
      done();
    } );
  } );

  it( 'should use custom blog directory', ( done ) => {
    files = {
      'blog.md': {
        sections: [ {
          hasPagingParams: true
        } ]
      },
      'posts/post1.md': {},
      'posts/post2.md': {},
      'posts/post3.md': {}
    };

    const plugin = blogPages( {
      pagesPerPage: 2,
      blogDirectory: 'posts/'
    } );

    plugin( files, metalsmith, () => {
      expect( files[ 'posts/2.md' ] ).to.exist;
      done();
    } );
  } );

  it( 'should maintain deep copied content in new pages', ( done ) => {
    const plugin = blogPages( { pagesPerPage: 3 } );
    plugin( files, metalsmith, () => {
      const originalSection = files[ 'blog.md' ].sections[ 0 ];
      const newPageSection = files[ 'blog/2.md' ].sections[ 0 ];

      newPageSection.someNewProp = 'test';
      expect( originalSection ).to.not.have.property( 'someNewProp' );
      done();
    } );
  } );

  // Error handling tests
  describe( 'error handling', () => {
    it( 'should throw on invalid pagesPerPage', ( done ) => {
      const plugin = blogPages( { pagesPerPage: -1 } );
      plugin( files, metalsmith, ( err ) => {
        expect( err ).to.exist;
        expect( err.message ).to.equal( 'pagesPerPage must be greater than 0' );
        done();
      } );
    } );

    it( 'should throw on missing blog.md', ( done ) => {
      delete files[ 'blog.md' ];
      const plugin = blogPages();
      plugin( files, metalsmith, ( err ) => {
        expect( err ).to.exist;
        expect( err.message ).to.equal( 'blog.md template file is required' );
        done();
      } );
    } );

    it( 'should throw on missing paging section', ( done ) => {
      files[ 'blog.md' ].sections = [ { hasPagingParams: false } ];
      const plugin = blogPages();
      plugin( files, metalsmith, ( err ) => {
        expect( err ).to.exist;
        expect( err.message ).to.equal( 'blog.md must contain a section with hasPagingParams: true' );
        done();
      } );
    } );

    it( 'should handle empty blog directory gracefully', ( done ) => {
      delete files[ 'blog/post1.md' ];
      files = {
        'blog.md': {
          sections: [ {
            hasPagingParams: true
          } ]
        }
      };
      const plugin = blogPages();
      plugin( files, metalsmith, ( err ) => {
        expect( err ).to.not.exist;
        done();
      } );
    } );

    it( 'should throw on invalid blogDirectory type', ( done ) => {
      const plugin = blogPages( { blogDirectory: 123 } );
      plugin( files, metalsmith, ( err ) => {
        expect( err ).to.exist;
        expect( err.message ).to.equal( 'blogDirectory must be a string' );
        done();
      } );
    } );
  } );
} );
