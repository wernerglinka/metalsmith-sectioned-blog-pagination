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

```js
import blogPages from `metalsmith-sectioned-blog-pagination`;

.use( blogPages( {
  "pagesPerPage": 12,
  "blogDirectory": "blog/",
} ) )
```



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

[npm-badge]: https://img.shields.io/npm/v/metalsmith-blog-lists.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-blog-lists
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-blog-lists
[license-url]: LICENSE
