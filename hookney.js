/**
 * Hookney - Helper around self referencing JSON objects for Node.js and the browser.
 *
 * @copyright: Copyright (c) 2016-present, tbillenstein
 *
 * @author: tbillenstein <tb@thomasbillenstein.com> (https://thomasbillenstein.com)
 *
 * @license This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


(function(window)
{
	const nodeEnv = typeof module === 'object' && module && typeof module.exports === 'object';
	const fs = nodeEnv ? require('fs') : null;
	const _ = nodeEnv ? require('lodash') : window._;

	const PATTERN = "\\$\\{self\\:(.*?)\\}";

	if (nodeEnv)
	{
		module.exports = Hookney;
	}
	else
	{
		/* istanbul ignore next */
		window.Hookney = Hookney;
	}

	function Hookney()
	{
		'use strict';

		const
			l = arguments.length,
			json = {};

		var i;

		for (i = 0; i < l; i++)
		{
			_.merge(json, arguments[i]);
		}

		this.json = function()
		{
			return json;
		};

		this.stringify = function(replacer, space)
		{
			return JSON.stringify(json, replacer, space);
		};

		this.resolveReferences = function()
		{
			walk(json);

			return this;
		};

		if (nodeEnv)
		{
			this.writeFile = function(file, options, done)
			{
				const self = this;

				if (!done)
				{
					done = options;
					options = {};
				}

				options = options || {};

				if (!options.encoding)
				{
					options.encoding = 'utf8';
				}

				fs.writeFile(file, this.stringify(options.replacer, options.space), options, function(err)
				{
					if (err)
					{
						done(err, null);
					}
					else
					{
						done(null, self);
					}
				});
			};

			this.writeFileSync = function(file, options)
			{
				options = options || {};

				if (!options.encoding)
				{
					options.encoding = 'utf8';
				}

				fs.writeFileSync(file, this.stringify(options.replacer, options.space), options);

				return this;
			};
		}

		function walk(collection)
		{
			var key,
				value,
				i,
				l;

			if (isObject(collection))
			{
				for (key in collection)
				{
					if (collection.hasOwnProperty(key))
					{
						value = collection[key];

						if (isObject(value))
						{
							walk(value);
						}
						else if (isArray(value))
						{
							walk(value);
						}
						else if (isString(value))
						{
							collection[key] = findReplace(PATTERN, value);
						}
					}
				}
			}
			else if (isArray(collection))
			{
				l = collection.length;

				for (i = 0; i < l; i++)
				{
					value = collection[i];

					if (isObject(value))
					{
						walk(value);
					}
					else if (isArray(value))
					{
						walk(value);
					}
					else if (isString(value))
					{
						collection[i] = findReplace(PATTERN, value);
					}
				}
			}
		}

		function findReplace(pattern, value)
		{
			const result = new RegExp(pattern, "gm").exec(value);

			var resolvedVaue;

			if (result)
			{
				// result[0] -> "${self:a.b.c}"
				// result[1] -> "a.b.c"

				resolvedVaue = _.get(json, result[1]);

				if (value === result[0])
				{
					value = resolvedVaue;
				}
				else
				{
					value = value.replace(result[0], isString(resolvedVaue) ? resolvedVaue : JSON.stringify(resolvedVaue));
				}

				if (isString(value))
				{
					value = findReplace(pattern, value);
				}
				else if (typeof value === 'object')
				{
					walk(value);
				}
			}

			return value;
		}
	}

	Hookney.from = function()
	{
		const
			l = arguments.length,
			json = {};

		var i;

		for (i = 0; i < l; i++)
		{
			_.merge(json, arguments[i]);
		}

		return new Hookney(json);
	};

	Hookney.fromString = function(text, reviver)
	{
		var json = {};

		if (text && isString(text) && text.length)
		{
			text = stripComment(text);
			json = JSON.parse(text, reviver);
		}

		return new Hookney(json);
	};

	if (nodeEnv)
	{
		Hookney.fromFile = function(path, options, done)
		{
			if (!done)
			{
				done = options;
				options = {};
			}

			options = options || {};

			if (!options.encoding)
			{
				options.encoding = 'utf8';
			}

			fs.readFile(path, options, function(err, content)
			{
				if (err)
				{
					done(err, null);
					return;
				}

				content = stripComment(content);

				try
				{
					done(null, Hookney.fromString(content, options.reviver));
				}
				catch (err)
				{
					err.message = path + ': ' + err.message;
					done(err, null);
				}
			});
		};

		Hookney.fromFileSync = function(path, options)
		{
			var content;

			options = options || {};

			if (!options.encoding)
			{
				options.encoding = 'utf8';
			}

			content = fs.readFileSync(path, options);

			content = stripComment(content);

			try
			{
				return Hookney.fromString(content, options.reviver);
			}
			catch (err)
			{
				err.message = path + ': ' + err.message;
				throw err;
			}
		};
	}

	function stripComment(json)
	{
		// Not sure where this originally came from, but I'm sure it was something MIT-licensed.
		// Shame on me.

		var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
			inString = false,
			inMultilineComment = false,
			inSinglelineComment = false,
			tmp,
			tmp2,
			newStr = [],
			ns = 0,
			from = 0,
			lc,
			rc;

		tokenizer.lastIndex = 0;

		while ((tmp = tokenizer.exec(json)) !== null)
		{
			lc = RegExp.leftContext;
			rc = RegExp.rightContext;

			if (!inMultilineComment && !inSinglelineComment)
			{
				tmp2 = lc.substring(from);
				if (!inString)
				{
					tmp2 = tmp2.replace(/(\n|\r|\s)*/g, "");
				}
				newStr[ns++] = tmp2;
			}

			from = tokenizer.lastIndex;

			if (tmp[0] === "\"" && !inMultilineComment && !inSinglelineComment)
			{
				tmp2 = lc.match(/(\\)*$/);

				if (!inString || !tmp2 || (tmp2[0].length % 2) === 0)
				{	// start of string with ", or unescaped " character found to end string
					inString = !inString;
				}

				from--; // include " character in next catch

				rc = json.substring(from);
			}
			else if (tmp[0] === "/*" && !inString && !inMultilineComment && !inSinglelineComment)
			{
				inMultilineComment = true;
			}
			else if (tmp[0] === "*/" && !inString && inMultilineComment && !inSinglelineComment)
			{
				inMultilineComment = false;
			}
			else if (tmp[0] === "//" && !inString && !inMultilineComment && !inSinglelineComment)
			{
				inSinglelineComment = true;
			}
			else if ((tmp[0] === "\n" || tmp[0] === "\r") && !inString && !inMultilineComment && inSinglelineComment)
			{
				inSinglelineComment = false;
			}
			else if (!inMultilineComment && !inSinglelineComment && !(/\n|\r|\s/.test(tmp[0])))
			{
				newStr[ns++] = tmp[0];
			}
		}

		newStr[ns++] = rc;

		return newStr.join("");
	}

	function isObject(value)
	{
		return typeof value === 'object' && !Array.isArray(value);
	}

	function isArray(value)
	{
		return Array.isArray(value);
	}

	function isString(value)
	{
		return typeof value === 'string';
	}
})(this);
