import path from 'node:path';
import { expect } from 'chai';
import Metalsmith from 'metalsmith';
import collections from '@metalsmith/collections';
import blogPages from '../src/index.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

/**
 * Helper — run a Metalsmith build and return the files object.
 * Accepts an array of plugins to use in order.
 */
function buildWith(fixture, plugins) {
  return new Promise((resolve, reject) => {
    const ms = Metalsmith(path.join(fixturesDir, fixture));
    ms.clean(false);

    for (const plugin of plugins) {
      ms.use(plugin);
    }

    ms.process((err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ files, metadata: ms.metadata() });
    });
  });
}

describe('blogPages plugin — directory scan (default)', () => {
  it('should not create additional pages when posts fit on one page', async () => {
    const { files } = await buildWith('basic', [
      blogPages({ pagesPerPage: 10 })
    ]);

    expect(files['blog/2.md']).to.be.undefined;
  });

  it('should create the correct number of pages', async () => {
    const { files } = await buildWith('basic', [
      blogPages({ pagesPerPage: 3 })
    ]);

    // 7 posts / 3 per page = 3 pages
    expect(files['blog/2.md']).to.exist;
    expect(files['blog/3.md']).to.exist;
    expect(files['blog/4.md']).to.be.undefined;
  });

  it('should update pagination params on main template and generated pages', async () => {
    const { files } = await buildWith('basic', [
      blogPages({ pagesPerPage: 3 })
    ]);

    const mainSection = files['blog.md'].sections[0];
    expect(mainSection.pagingParams.numberOfBlogs).to.equal(7);
    expect(mainSection.pagingParams.numberOfPages).to.equal(3);
    expect(mainSection.pagingParams.pageLength).to.equal(3);
    expect(mainSection.pagingParams.pageStart).to.equal(0);
    expect(mainSection.pagingParams.pageNumber).to.equal(1);

    const page2Section = files['blog/2.md'].sections[0];
    expect(page2Section.pagingParams.pageStart).to.equal(3);
    expect(page2Section.pagingParams.pageNumber).to.equal(2);

    const page3Section = files['blog/3.md'].sections[0];
    expect(page3Section.pagingParams.pageStart).to.equal(6);
    expect(page3Section.pagingParams.pageNumber).to.equal(3);
  });

  it('should deep-clone pages so mutations do not leak', async () => {
    const { files } = await buildWith('basic', [
      blogPages({ pagesPerPage: 3 })
    ]);

    files['blog/2.md'].sections[0].injected = true;
    expect(files['blog.md'].sections[0]).to.not.have.property('injected');
    expect(files['blog/3.md'].sections[0]).to.not.have.property('injected');
  });

  it('should handle posts exactly matching pagesPerPage (no extra page)', async () => {
    const { files } = await buildWith('basic', [
      blogPages({ pagesPerPage: 7 })
    ]);

    expect(files['blog/2.md']).to.be.undefined;
  });
});

describe('blogPages plugin — sections without placeholder pagingParams', () => {
  it('should create the pagingParams block when the frontmatter has none', async () => {
    // The no-placeholders fixture declares hasPagingParams: true but no
    // pagingParams block. Before the fix this was a silent no-op: the
    // update walked the section, found no matching keys, and dropped
    // every value, so templates rendered the full collection.
    const { files } = await buildWith('no-placeholders', [
      blogPages({ pagesPerPage: 2 })
    ]);

    const mainSection = files['blog.md'].sections[0];
    expect(mainSection.pagingParams).to.deep.equal({
      numberOfBlogs: 3,
      numberOfPages: 2,
      pageLength: 2,
      pageStart: 0,
      pageNumber: 1
    });

    const page2Section = files['blog/2.md'].sections[0];
    expect(page2Section.pagingParams.pageStart).to.equal(2);
    expect(page2Section.pagingParams.pageNumber).to.equal(2);
  });

  it('should fill in missing keys without disturbing declared ones', async () => {
    // A partial placeholder block: declared keys are updated in place,
    // undeclared ones are added to the same pagingParams object.
    const { files } = await buildWith('no-placeholders', [
      (files, metalsmith, done) => {
        files['blog.md'].sections[0].pagingParams = { pageNumber: '', customKey: 'kept' };
        done();
      },
      blogPages({ pagesPerPage: 2 })
    ]);

    const mainSection = files['blog.md'].sections[0];
    expect(mainSection.pagingParams.pageNumber).to.equal(1);
    expect(mainSection.pagingParams.numberOfPages).to.equal(2);
    expect(mainSection.pagingParams.pageStart).to.equal(0);
    expect(mainSection.pagingParams.customKey).to.equal('kept');
  });
});

describe('blogPages plugin — collectionName option', () => {
  it('should count only collection members, not category pages', async () => {
    // The with-collections fixture has 3 actual posts + 2 category landing pages
    // in the writing/ directory. Without collectionName the directory scan counts 5.
    // With collectionName it should count 3 from the collection.
    const { files } = await buildWith('with-collections', [
      collections({ writing: { pattern: 'writing/*/*/*.md', sortBy: 'date', reverse: true } }),
      blogPages({
        pagesPerPage: 2,
        blogDirectory: 'writing/',
        mainTemplate: 'writing.md',
        collectionName: 'writing'
      })
    ]);

    // 3 posts / 2 per page = 2 pages
    const mainSection = files['writing.md'].sections[0];
    expect(mainSection.pagingParams.numberOfBlogs).to.equal(3);
    expect(mainSection.pagingParams.numberOfPages).to.equal(2);
    expect(mainSection.pagingParams.pageNumber).to.equal(1);

    expect(files['writing/2.md']).to.exist;
    const page2 = files['writing/2.md'].sections[0];
    expect(page2.pagingParams.pageNumber).to.equal(2);
    expect(page2.pagingParams.pageStart).to.equal(2);

    // No third page
    expect(files['writing/3.md']).to.be.undefined;
  });

  it('should produce extra page when directory scan overcounts (proves the fix)', async () => {
    // Same fixture WITHOUT collectionName — directory scan includes category pages
    const { files } = await buildWith('with-collections', [
      blogPages({
        pagesPerPage: 2,
        blogDirectory: 'writing/',
        mainTemplate: 'writing.md'
      })
    ]);

    // Directory scan finds 5 files (3 posts + 2 category pages)
    // 5 / 2 = 3 pages — the off-by-one the user reported
    const mainSection = files['writing.md'].sections[0];
    expect(mainSection.pagingParams.numberOfBlogs).to.equal(5);
    expect(mainSection.pagingParams.numberOfPages).to.equal(3);
    expect(files['writing/3.md']).to.exist;
  });

  it('should throw when the named collection does not exist', async () => {
    try {
      await buildWith('basic', [
        blogPages({ collectionName: 'nonexistent' })
      ]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).to.include('Collection "nonexistent" not found');
    }
  });
});

describe('blogPages plugin — error handling', () => {
  it('should throw on invalid pagesPerPage', async () => {
    try {
      await buildWith('basic', [blogPages({ pagesPerPage: -1 })]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).to.equal('pagesPerPage must be greater than 0');
    }
  });

  it('should throw on missing main template', async () => {
    try {
      await buildWith('basic', [blogPages({ mainTemplate: 'missing.md' })]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).to.equal('missing.md template file is required');
    }
  });

  it('should throw on missing paging section', async () => {
    // Use a post file as mainTemplate — it has no hasPagingParams section
    try {
      await buildWith('basic', [blogPages({ mainTemplate: 'blog/post1.md' })]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).to.include('must contain a section with hasPagingParams');
    }
  });

  it('should throw on invalid blogDirectory type', async () => {
    try {
      await buildWith('basic', [blogPages({ blogDirectory: 123 })]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).to.equal('blogDirectory must be a string');
    }
  });

  it('should throw on invalid mainTemplate type', async () => {
    try {
      await buildWith('basic', [blogPages({ mainTemplate: 123 })]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).to.equal('mainTemplate must be a string');
    }
  });
});
