import { expect } from 'chai';
import blogPages from '../src/index.js';

describe('metalsmith-sectioned-blog-pagination additional tests', () => {
  let files, metalsmith;

  beforeEach(() => {
    files = {
      'blog.md': {
        sections: [{
          hasPagingParams: true,
          numberOfBlogs: 0,
          numberOfPages: 0,
          pageLength: 0,
          pageStart: 0,
          pageNumber: 0
        }]
      },
      'blog/post1.md': {},
      'blog/post2.md': {},
      'blog/post3.md': {}
    };

    metalsmith = {
      debug: () => () => {}
    };
  });

  // Test the new mainTemplate option
  it('should use a custom template file', (done) => {
    // Replace the standard blog.md with articles.md
    files['articles.md'] = JSON.parse(JSON.stringify(files['blog.md']));
    delete files['blog.md'];

    const plugin = blogPages({
      pagesPerPage: 2,
      blogDirectory: 'blog/',
      mainTemplate: 'articles.md'
    });

    plugin(files, metalsmith, () => {
      expect(files['blog/2.md']).to.exist;
      expect(files['articles.md'].sections[0].numberOfBlogs).to.equal(3);
      expect(files['articles.md'].sections[0].numberOfPages).to.equal(2);
      done();
    });
  });

  // Test error handling for mainTemplate option
  it('should throw on invalid mainTemplate type', (done) => {
    const plugin = blogPages({ mainTemplate: 123 });
    plugin(files, metalsmith, (err) => {
      expect(err).to.exist;
      expect(err.message).to.equal('mainTemplate must be a string');
      done();
    });
  });

  // Test error handling for deep cloning
  it('should handle JSON stringify/parse errors', (done) => {
    // Create a circular reference which JSON.stringify cannot handle
    const circular = {};
    circular.self = circular;
    files['blog.md'].circular = circular;

    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, (err) => {
      expect(err).to.exist;
      expect(err.message).to.include('Failed to create page 2');
      done();
    });
  });

  // Test the debug option with metalsmith debug
  it('should work with metalsmith debug enabled', (done) => {
    let debugCalled = false;
    metalsmith.debug = () => {
      return () => {
        debugCalled = true;
      };
    };

    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, () => {
      expect(debugCalled).to.be.true;
      done();
    });
  });

  // Test that updateProperty handles null/undefined correctly
  it('should handle null/undefined values in updateProperty', (done) => {
    files['blog.md'].sections[0].nestedObj = {
      first: null,
      second: undefined,
      third: {
        value: 'test'
      }
    };

    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, (err) => {
      expect(err).to.not.exist;
      expect(files['blog/2.md']).to.exist;
      done();
    });
  });

  // Test with deeply nested sections
  it('should update all instances of pagination params in deeply nested objects', (done) => {
    files['blog.md'].sections[0].nested = {
      deeper: {
        deepest: {
          numberOfBlogs: 0,
          pageNumber: 0
        }
      }
    };

    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, () => {
      // Check main page
      expect(files['blog.md'].sections[0].nested.deeper.deepest.numberOfBlogs).to.equal(3);
      expect(files['blog.md'].sections[0].nested.deeper.deepest.pageNumber).to.equal(1);
      
      // Check page 2
      expect(files['blog/2.md'].sections[0].nested.deeper.deepest.numberOfBlogs).to.equal(3);
      expect(files['blog/2.md'].sections[0].nested.deeper.deepest.pageNumber).to.equal(2);
      done();
    });
  });

  // Test custom page path format
  it('should handle custom page path format', (done) => {
    files = {
      'content/blog.md': {
        sections: [{
          hasPagingParams: true,
          numberOfBlogs: 0
        }]
      },
      'blog/post1.md': {},
      'blog/post2.md': {},
      'blog/post3.md': {}
    };

    const plugin = blogPages({
      pagesPerPage: 2,
      blogDirectory: 'blog/',
      mainTemplate: 'content/blog.md'
    });

    plugin(files, metalsmith, () => {
      expect(files['blog/2.md']).to.exist;
      // The plugin should update the numberOfBlogs property
      expect(files['content/blog.md'].sections[0].numberOfBlogs).to.equal(3);
      done();
    });
  });

  // This test would require modification of the plugin to update all sections with hasPagingParams
  // Currently the plugin only updates the first section with hasPagingParams
  it('should update the section marked with hasPagingParams', (done) => {
    // Create a test file with multiple sections where only the first has hasPagingParams
    files = {
      'blog.md': {
        sections: [
          {
            hasPagingParams: true,
            numberOfBlogs: 0,
            pageNumber: 0
          },
          {
            hasPagingParams: false,
            numberOfBlogs: 0,
            pageNumber: 0
          }
        ]
      },
      'blog/post1.md': {},
      'blog/post2.md': {},
      'blog/post3.md': {}
    };

    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, () => {
      // Check that first section was updated
      expect(files['blog.md'].sections[0].numberOfBlogs).to.equal(3);
      // Second section should not be updated since it doesn't have hasPagingParams: true
      expect(files['blog.md'].sections[1].numberOfBlogs).to.equal(0);
      
      // Check pagination page sections
      expect(files['blog/2.md'].sections[0].pageNumber).to.equal(2);
      done();
    });
  });

  // Test edge case with posts exactly equal to pagesPerPage
  it('should handle edge case with posts exactly matching pagesPerPage', (done) => {
    files = {
      'blog.md': {
        sections: [{
          hasPagingParams: true
        }]
      },
      'blog/post1.md': {},
      'blog/post2.md': {}
    };

    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, () => {
      expect(Object.keys(files)).to.have.length(3);
      expect(files['blog/2.md']).to.be.undefined;
      done();
    });
  });

  // Test performance with large number of posts
  it('should handle a large number of posts efficiently', (done) => {
    const largeFiles = {
      'blog.md': {
        sections: [{
          hasPagingParams: true
        }]
      }
    };
    
    // Create 100 blog posts
    for (let i = 1; i <= 100; i++) {
      largeFiles[`blog/post${i}.md`] = {};
    }
    
    const start = Date.now();
    const plugin = blogPages({ pagesPerPage: 10 });
    
    plugin(largeFiles, metalsmith, () => {
      const duration = Date.now() - start;
      // Should generate 10 pagination pages + main page = 11 total pages
      // Plus 100 blog posts = 111 total files
      // But it actually creates blog/1.md through blog/10.md = 10 pagination pages
      expect(Object.keys(largeFiles)).to.have.length(110); // 100 posts + main + 9 pagination pages
      expect(duration).to.be.below(500); // Should be fast (less than 500ms)
      done();
    });
  });

  // Test handling posts with mixed content types
  it('should handle posts with mixed content types', (done) => {
    files['blog/post1.md'].date = new Date('2023-01-01');
    files['blog/post2.md'].customData = { key: 'value' };
    files['blog/post3.md'].contents = Buffer.from('Test content');
    
    const plugin = blogPages({ pagesPerPage: 2 });
    plugin(files, metalsmith, () => {
      expect(files['blog.md'].sections[0].numberOfBlogs).to.equal(3);
      expect(files['blog/2.md']).to.exist;
      done();
    });
  });
});