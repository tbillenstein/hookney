Hookney
=======

`Hookney` is a helper around self-referencing JSON objects for Node.js and the browser.
`Hookney` supports reading from and writing to files. JSON files may contain comments.
This makes `Hookney` ideal for handling configuration files.


Getting started
---------------

### Node.js

Install `hookney` using npm.

```shell
npm install hookney --save
```

Then require it into any module.

```js
const Hookney = require('hookney');
```

### Browser
`Hookney` has a single dependency to [lodash](https://lodash.com/), which must be loaded before using `Hookney`.

You can download the latest release from the repository
* [`hookney.js`](https://github.com/tbillenstein/hookney/blob/master/hookney.js) unminified, including comments
* [`hookney.min.js`](https://github.com/tbillenstein/hookney/blob/master/hookney.min.js) minified version

Load [lodash](https://lodash.com/) from a CDN or any other source.
```html
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.20/lodash.min.js"></script>

<!-- Alternative CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js"></script>

<!-- Load from local node module -->
<script src="node_modules/lodash/lodash.min.js"></script>
```

Use a script tag to directly add `Hookney` to the global scope.

```html
<script src="hookney.min.js"></script>
```


Usage
-----
```js
const json = {
  custom: {
    tableName: 'users-table-${self:provider.stage}'
  },

  provider: {
    stage: 'dev'
  },

  environment: {
    USERS_TABLE: '${self:custom.tableName}'
  },

  configOptions: [
    {
      // Scenario 'high'
      limit: '1mb',
      strict: true,
      extended: true
    },
    {
      // Scenario 'mid'
      limit: '500kb',
      strict: true,
      extended: false
    },
    {
      // Scenario 'low'
      limit: '10kb',
      strict: false,
      extended: false
    }
  ],

  config: '${self:configOptions[1]}'
};

const config = new Hookney(json).resolveReferences().json();

// => result:
config === {
  custom: {
    tableName: 'users-table-dev'
  },

  provider: {
    stage: 'dev'
  },

  environment: {
    USERS_TABLE: 'users-table-dev'
  },

  configOptions: [
    {
      limit: '1mb',
      strict: true,
      extended: true
    },
    {
      limit: '500kb',
      strict: true,
      extended: false
    },
    {
      limit: '10kb',
      strict: false,
      extended: false
    }
  ],

  config: {
    limit: '500kb',
    strict: true,
    extended: false
  }  
}
```


Examples
--------

### Use given JSON object and resolve references.

```js
const json = { a: 1, b: "str", c: '${self:a}' };

const config = Hookney.from(json).resolveReferences().json();

// is equivalent to:

const config = new Hookney(json).resolveReferences().json();

// => config === { a: 1, b: "str", c: 1 }

// Given JSON object is not touched, instead a deep clone is created.
// => json === { a: 1, b: "str", c: '${self:a}' }
```

### Create JSON object from text and resolve references. Text may contain comments.

```js
const text = '{ "a": 1, "b": "str", "c": "${self:a}" }';

const config = Hookney.fromString(text).resolveReferences().json();

// => config === { a: 1, b: "str", c: 1 }
```

### Load JSON object from a file and resolve references. JSON file may contain comments.

```js
// Synchronous
const config = Hookney.fromFileSync("/path/to/file.json").resolveReferences().json();

// Asynchronous
Hookney.fromFile("/path/to/file.json", function(err, hookney)
{
  if (err)
  {
    // Handle error.
    return;
  }

  const config = hookney.resolveReferences().json();
});
```

`Hookney.fromFile()` and `Hookney.fromFileSync()` support an optional `options` parameter.

```js
const options = {
  encoding: 'utf8', // Default encoding
  flag: 'r',        // Default flag

  reviver: null     // Default is no reviver
};

hookney.fromFileSync("/path/to/file.json", options);

Hookney.fromFile("/path/to/file.json", options, function(err, hookney)
{
});
```

For details on the `options` parameter, please refer to the 
[Node.js documentation](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback).

In addition to the options described there, 1 additional parameter `reviver` is supported.
Please refer to the 
[JSON.parse() documentation](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
for details.

`Hookney.fromFile()` and `Hookney.fromFileSync()` are not available in the browser.

### Write JSON object to file.

```js
const hookney = new Hookney({ a: 1, b: "str", c: true });

// Synchronous
hookney.writeFileSync("/path/to/file.json");

// Asynchronous
Hookney.writeFile("/path/to/file.json", function(err)
{
  if (err)
  {
    // Handle error.
  }
});
```

`writeFile()` and `writeFileSync()` support an optional `options` parameter.

```js
const options = {
  encoding: 'utf8', // Default encoding
  mode: 0o666,      // Default mode
  flag: 'w',         // Default flag

  replacer: null,   // Default is no replacer
  space: null       // Default is no space
};

hookney.writeFileSync("/path/to/file.json", options);

Hookney.writeFile("/path/to/file.json", options, function(err)
{
});
```

For details on the `options` parameter, please refer to the 
[Node.js documentation](https://nodejs.org/api/fs.html#fs_fs_writefilesync_file_data_options).

In addition to the options described there, 2 additional parameters `replacer` and `space` are supported.
Please refer to the 
[JSON.stringify() documentation](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
for details.

`writeFile()` and `writeFileSync()` are not available in the browser.


More examples
-------------
Please refer to the [test spec](https://github.com/tbillenstein/hookney/blob/master/spec/HookneySpec.js) for more examples.


Testing
-------
We use 
* [JSHint](https://jshint.com/) for static code analysis.
* [Jasmine testing framework](https://jasmine.github.io/index.html) for testing.
* [Karma test runner](https://karma-runner.github.io/latest/index.html) for testing in the browser.
* [Istanbul test coverage framework](https://istanbul.js.org/) for tracking test coverage.

Steps to be taken
* Clone or download the repository.
* Change into the project directory.
* Use `npm install` to install all development dependencies.
* Use `npm runt lint` to run static code analysis. 
* Use `npm test` to run the tests. 
* Use `npm run coverage` to track test coverage. 
* The output should display successful execution results and a code coverage map.


Build
-----
* Clone or download the repository.
* Change into project directory.
* Use `npm run build` in project directory to build `hookney.min.js` from `hookney.js`.


Contribution
------------
Please use [Github issues](https://github.com/tbillenstein/hookney/issues) for requests.

Pull requests are welcome.


Issues
------
We use GitHub issues to track bugs. Please ensure your bug description is clear and has sufficient instructions to be 
able to reproduce the issue.

The absolute best way to report a bug is to submit a pull request including a new failing test which describes the bug. 
When the bug is fixed, your pull request can then be merged.

The next best way to report a bug is to provide a reduced test case on jsFiddle or jsBin or produce exact code inline 
in the issue which will reproduce the bug.


Support
-------
* Send us an email: [tb@thomasbillenstein.com](mailto:tb@thomasbillenstein.com)
* Follow us on Twitter: [@tbillenstein](https://x.com/tbillenstein/)


Changelog
---------
v1.2.0
* Update npm modules.
* Update and extend test environment.
* Add static code analysis tool JSHint.
* Add Karma test runner.
* Fix JSHint issues.
* Replace uglify-js by terser for minification.
* Update README.

v1.1.4
* Update npm modules.

v1.1.3
* Update npm modules.

v1.1.2
* Update npm modules.

v1.1.0
* Support multiple arguments on instantiation.

v1.0.1
* Fix .npmignore

v1.0.0
* Initial public release


License
-------
Copyright (c) 2016-present, tbillenstein. `Hookney` is licensed under the 
[MIT License](https://github.com/tbillenstein/hookney/blob/master/LICENSE).
