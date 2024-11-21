# Metalsmith Sectioned Blog Pagination

Metalsmith plugin that generates paginated blog landing pages from a main blog template

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]

Metalsmith Sectioned Blog Pagination creates metadata for blog pagination for pages built with a [modular page building paradigm](https://metalsmith-components.netlify.app/).

## Installation

**NPM:**

```
npm install metalsmith-sectioned-blog-pagination
```

**Yarn:**

```
yarn add metalsmith-sectioned-blog-pagination
```

## Usage

Pass `metalsmith-sectioned-blog-pagination` to `metalsmith.use` :

The plugin must be used before the Markdown, Permalinks and Layouts plugins.

```js
import blogPages from `metalsmith-sectioned-blog-pagination`;

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
    "pagesPerPage": 12,
    "blogDirectory": "blog/",
  }))
  .use(markdown())
  .use(permalinks())
  .use(layouts())
  .
  .
```
During the build process, the plugin will create a set of blog landing pages with the specified number of blog posts per page, e.g. `/blog/`, `/blog/2`, `/blog/3`... In a Nunjucks template, a pager would be constructed like this:

```html
<ul class="blogs-pagination">
  {% for i in range(0, params.numberOfPages) -%}
    <li {% if ((i + 1) == params.pageNumber) %}class="active"{% endif %}>
      {% if i == 0 %}
        <a href="/blog/">1</a>
      {% else %}
        <a href="/blog/{{ i + 1 }}/">{{ i + 1 }}</a>
      {% endif %}
    </li>
  {%- endfor %}
</ul>
```
Here is [the complete template](https://github.com/wernerglinka/glinka.dev.2024/blob/main/templates/blocks/all-blogs.njk) for such a blog landing page. And here is [the implementation](https://www.glinka.co/blog/).

### Debug

To enable debug logs, set the `DEBUG` environment variable to `metalsmith-sectioned-blog-pagination`:

```
metalsmith.env('DEBUG', 'metalsmith-sectioned-blog-pagination*')
```

### CLI usage

To use this plugin with the Metalsmith CLI, add `metalsmith-sectioned-blog-pagination` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "metalsmith-sectioned-blog-pagination": {
        "pagesPerPage": 12,
        "blogDirectory": "blog/",
      }
    }
  ]
}
```

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
