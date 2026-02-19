# Metalsmith Sectioned Blog Pagination

Metalsmith plugin that generates  metadata for blog pagination for pages built with a [modular page building paradigm](https://metalsmith-components.netlify.app/).

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]
[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-sectioned-blog-pagination/badge.svg)](https://snyk.io/test/npm/metalsmith-sectioned-blog-pagination)

## Features

- **ESM and CommonJS support**:
  - ESM: `import prism from 'metalsmith-prism'`
  - CommonJS: `const prism = require('metalsmith-prism')`

## Requirements

- Node.js >= 18.0.0
- Metalsmith >= 2.6.0

## Installation

```
npm install metalsmith-sectioned-blog-pagination
```

## Usage

Pass options to `metalsmith-sectioned-blog-pagination` in `metalsmith.use` :

The plugin must be used before the Markdown, Permalinks and Layouts plugins.

```js
Metalsmith( __dirname )
  .use(collections({
    blog: {
      pattern: "blog/*.md",
      sortBy: "date",
      reverse: true,
      limit: 50,
    },
  }))
  .use(blogPages({
    "pagesPerPage": 12,            // Number of blog posts per page
    "blogDirectory": "blog/",      // Directory containing your blog posts
    "mainTemplate": "blog.md"      // Main blog template file (default: "blog.md")
  }))
  .use(markdown())
  .use(permalinks())
  .use(layouts())
  ...
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pagesPerPage` | `number` | `6` | Number of blog posts to display per page |
| `blogDirectory` | `string` | `'blog/'` | Directory containing blog post files (with trailing slash) |
| `mainTemplate` | `string` | `'blog.md'` | Main blog template file to use as template for pagination |

## Examples

### Basic Blog Pagination

Create paginated blog pages with 10 posts per page:

```javascript
metalsmith
  .use(collections({
    blog: {
      pattern: 'blog/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(blogPages({
    pagesPerPage: 10,
    blogDirectory: 'blog/',
    mainTemplate: 'blog.md'
  }))
```

### Multiple Blog Sections

For sites with multiple blog sections, run the plugin multiple times:

```javascript
metalsmith
  // Tech blog section
  .use(collections({
    techBlog: {
      pattern: 'tech/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(blogPages({
    pagesPerPage: 8,
    blogDirectory: 'tech/',
    mainTemplate: 'tech-blog.md'
  }))
  // Personal blog section
  .use(collections({
    personalBlog: {
      pattern: 'personal/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(blogPages({
    pagesPerPage: 5,
    blogDirectory: 'personal/',
    mainTemplate: 'personal-blog.md'
  }))
```

### Custom Blog Directory Structure

Use a nested directory structure for your blog:

```javascript
metalsmith
  .use(blogPages({
    pagesPerPage: 15,
    blogDirectory: 'content/articles/',
    mainTemplate: 'articles.md'
  }))
  // This will create: /content/articles/, /content/articles/2/, etc.
```

During the build process, the plugin will create a set of blog landing pages with the specified number of blog posts per page, e.g. `/blog/`, `/blog/2`, `/blog/3`... In a Nunjucks template, a pager would be constructed like this:

```html
<ul class="blogs-pagination">
  {% for i in range(0, params.numberOfPages) -%}
  <li {% if ((i + 1)="" ="params.pageNumber)" %}class="active" {% endif %}>
    {% if i == 0 %}
    <a href="/blog/">1</a>
    {% else %}
    <a href="/blog/{{ i + 1 }}/">{{ i + 1 }}</a>
    {% endif %}
  </li>
  {%- endfor %}
</ul>
```

And [complete template implementation in Nunjucks](https://github.com/wernerglinka/glinka.dev.2024/blob/main/templates/blocks/all-blogs.njk) for such a blog landing page can be viewed here. And here is an example of [an implementation](https://www.glinka.co/blog/).

### Debug

To enable debug logs, set the `DEBUG` environment variable to `metalsmith-sectioned-blog-pagination`:

Linux/Mac:
```
DEBUG=metalsmith-sectioned-blog-pagination
```

Windows:
```
set DEBUG=metalsmith-sectioned-blog-pagination
```

### CLI usage

To use this plugin with the Metalsmith CLI, add `metalsmith-sectioned-blog-pagination` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "metalsmith-sectioned-blog-pagination": {
        "pagesPerPage": 12,
        "blogDirectory": "blog/"
      }
    }
  ]
}
```

## Test Coverage

This project maintains high statement and line coverage for the source code. Coverage is verified during the release process using the c8 coverage tool.

## Author

[werner@glinka.co](https://github.com/wernerglinka)

## License

[MIT](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/metalsmith-sectioned-blog-pagination.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-sectioned-blog-pagination
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-sectioned-blog-pagination
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-98%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-sectioned-blog-pagination/actions/workflows/test.yml
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue