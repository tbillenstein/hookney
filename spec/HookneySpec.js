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


var Hookney = Hookney || require('../hookney');

const nodeEnv = typeof module === 'object' && module && typeof module.exports === 'object';

describe("Hookney", function()
{
	describe("Instantiation", function()
	{
		it("should return given json.", function()
		{
			const json = { a: 1, b: "c" };
			const hookney = new Hookney(json);

			expect(hookney.json()).not.toBe(json);
			expect(hookney.json()).toEqual(json);
		});

		it("should return {} on given null/undefined.", function()
		{
			expect(new Hookney(null).json()).toEqual({});
			expect(new Hookney().json()).toEqual({});
		});

		it("should handle multiple parameters.", function()
		{
			expect(new Hookney({ a: 1, b: 2 }, { c: "three" }, { b: 3 }).json()).toEqual({a: 1, b: 3, c: "three"});
		});

		it("should resolve all references in JSON object composed of multiple parameters.", function()
		{
			const json1 = {
				a: { x: 0, y: "str", z: true }
			};

			const json2 = {
				r1: "${self:a}"
			};

			const json3 = {
				r2: "str: ${self:a}"
			};

			const config = new Hookney(json1, json2, json3).resolveReferences().json();

			expect(config).toEqual({
				a: { x: 0, y: "str", z: true },

				r1: { x: 0, y: "str", z: true },
				r2: 'str: {"x":0,"y":"str","z":true}'
			});
			expect(json1).toEqual({
				a: { x: 0, y: "str", z: true }
			});
			expect(json2).toEqual({
				r1: "${self:a}"
			});
			expect(json3).toEqual({
					r2: "str: ${self:a}"
			});
		});
	});

	describe("Stringify", function()
	{
		it("should stringify.", function()
		{
			expect(new Hookney({ a: 1, b: "c" }).stringify()).toBe('{"a":1,"b":"c"}');
		});

		it("should stringify null/undefined to {}.", function()
		{
			expect(new Hookney(null).stringify()).toBe('{}');
			expect(new Hookney().stringify()).toBe('{}');
		});
	});

	describe("From JSON object", function()
	{
		it("should parse.", function()
		{
			expect(Hookney.from({ a: 1, b: "str", c: true }).json()).toEqual({ a: 1, b: "str", c: true });
		});

		it("should handle null/undefined.", function()
		{
			expect(Hookney.from(null).json()).toEqual({});
			expect(Hookney.from(undefined).json()).toEqual({});
		});

		it("should resolve all references in JSON object composed of multiple parameters.", function()
		{
			const json1 = {
				a: { x: 0, y: "str", z: true }
			};

			const json2 = {
				r1: "${self:a}"
			};

			const json3 = {
				r2: "str: ${self:a}"
			};

			const config = Hookney.from(json1, json2, json3).resolveReferences().json();

			expect(config).toEqual({
				a: { x: 0, y: "str", z: true },

				r1: { x: 0, y: "str", z: true },
				r2: 'str: {"x":0,"y":"str","z":true}'
			});
			expect(json1).toEqual({
				a: { x: 0, y: "str", z: true }
			});
			expect(json2).toEqual({
				r1: "${self:a}"
			});
			expect(json3).toEqual({
				r2: "str: ${self:a}"
			});
		});

	});

	describe("From string", function()
	{
		it("should parse.", function()
		{
			expect(Hookney.fromString('{ "a": 1, "b": "str", "c": true }').json()).toEqual({ a: 1, b: "str", c: true });
		});

		it("should parse with comments.", function()
		{
			expect(Hookney.fromString('{ "a": 1, /* "b": "c", */ "d": true }').json()).toEqual({ a: 1, d: true});
		});

		it("should parse null.", function()
		{
			expect(Hookney.fromString(null).json()).toEqual({});
		});

		it("should parse empty string.", function()
		{
			expect(Hookney.fromString('').json()).toEqual({});
		});
	});

	if (nodeEnv)
	{
		describe("From file", function()
		{
			it("should load json from file (sync / no comments).", function()
			{
				expect(Hookney.fromFileSync('./spec/test1.json').json()).toEqual({ a: 1, b: "c", d: true});
			});

			it("should load json from file (sync / comments).", function()
			{
				expect(Hookney.fromFileSync('./spec/test2.json').json()).toEqual({ a: 1, b: "c", d: true});
			});

			it("should handle json file loading with invalid path (sync).", function()
			{
				expect( function(){ Hookney.fromFileSync('./invalid/path/file.json'); } ).toThrow();
			});

			it("should handle json file loading with invalid JSON (sync).", function()
			{
				expect( function(){ Hookney.fromFileSync('./spec/invalid.json'); } ).toThrow();
			});

			it("should load json from file (async / no comments).", function(done)
			{
				Hookney.fromFile('./spec/test1.json', function(err, hookney)
				{
					expect(err).toBeNull();
					expect(hookney.json()).toEqual({ a: 1, b: "c", d: true});
					done();
				});
			});

			it("should load json from file (async / comments).", function(done)
			{
				Hookney.fromFile('./spec/test2.json', function(err, hookney)
				{
					expect(err).toBeNull();
					expect(hookney.json()).toEqual({ a: 1, b: "c", d: true});
					done();
				});
			});

			it("should handle json file loading with invalid path (async).", function(done)
			{
				Hookney.fromFile('./invalid/path/file.json', function(err, hookney)
				{
					expect(err).toBeDefined();
					expect(hookney).toBeNull();
					done();
				});
			});

			it("should handle json file loading with invalid JSON a(sync).", function(done)
			{
				expect( function(){ Hookney.fromFileSync('./spec/invalid.json'); } ).toThrow();

				Hookney.fromFile('./spec/invalid.json', function(err, hookney)
				{
					expect(err).toBeDefined();
					expect(hookney).toBeNull();
					done();
				});
			});
		});

		describe("Write to file", function()
		{
			it("should write json to file (sync).", function()
			{
				const file = './spec/write-test1.json';

				new Hookney({ a: 1, b: "c", d: true}).writeFileSync(file);

				expect(Hookney.fromFileSync(file).json()).toEqual({ a: 1, b: "c", d: true});
			});

			it("should handle json file writing with invalid path (sync).", function()
			{
				expect( function(){ new Hookney({}).writeFileSync('./invalid/path/file.json'); } ).toThrow();
			});

			it("should write json to file (async).", function(done)
			{
				const file = './spec/write-test2.json';

				new Hookney({ a: 1, b: "c", d: true}).writeFile(file, function(err)
				{
					expect(err).toBeNull();

					Hookney.fromFile(file, function(err, hookney)
					{
						expect(hookney.json()).toEqual({ a: 1, b: "c", d: true});
						done();
					});
				});
			});

			it("should handle json file writing with invalid path (async).", function(done)
			{
				new Hookney({ a: 1, b: "c", d: true}).writeFile('./invalid/path/file.json', function(err)
				{
					expect(err).toBeDefined();
					done();
				});
			});
		});
	}

	describe("Resolve references.", function()
	{
		it("should resolve all references.", function()
		{
			const json = {
				a: { x: 0, y: "str", z: true },

				r1: "${self:a}",
				r2: "str: ${self:a}"
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				a: { x: 0, y: "str", z: true },

				r1: { x: 0, y: "str", z: true },
				r2: 'str: {"x":0,"y":"str","z":true}'
			});
			expect(json).toEqual({
				a: { x: 0, y: "str", z: true },

				r1: "${self:a}",
				r2: "str: ${self:a}"
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				a: { x: 0, y: "str", z: true },

				r1: "${self:a}",
				r2: "${self:r1}",
				r3: "r3: ${self:r2}"
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				a: { x: 0, y: "str", z: true },

				r1: { x: 0, y: "str", z: true },
				r2: { x: 0, y: "str", z: true },
				r3: 'r3: {"x":0,"y":"str","z":true}'
			});
			expect(json).toEqual({
				a: { x: 0, y: "str", z: true },

				r1: "${self:a}",
				r2: "${self:r1}",
				r3: "r3: ${self:r2}"
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				i: { j: 0, k: "str", l: true },

				v3: "v3: ${self:v2}",
				v2: "${self:v1}",
				v1: "${self:i}"
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				i: { j: 0, k: "str", l: true },

				v3: 'v3: {"j":0,"k":"str","l":true}',
				v2: { j: 0, k: "str", l: true },
				v1: { j: 0, k: "str", l: true }
			});
			expect(json).toEqual({
				i: { j: 0, k: "str", l: true },

				v3: "v3: ${self:v2}",
				v2: "${self:v1}",
				v1: "${self:i}"
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				a: { x: 0, y: "str", z: true },
				b: {
					c: {
						e: {
							f: "str: ${self:a.x}"
						}
					},
					d: "${self:a.z}"
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				a: { x: 0, y: "str", z: true },
				b: {
					c: {
						e: {
							f: "str: 0"
						}
					},
					d: true
				}
			});
			expect(json).toEqual({
				a: { x: 0, y: "str", z: true },
				b: {
					c: {
						e: {
							f: "str: ${self:a.x}"
						}
					},
					d: "${self:a.z}"
				}
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				a: { x: 0, y: "str", z: true },
				b: {
					c: {
						e: {
							f: "str: ${self:a.x}"
						}
					},
					d: "${self:a.z}"
				},
				y: {
					z: "${self:b}"
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				a: { x: 0, y: "str", z: true },
				b: {
					c: {
						e: {
							f: "str: 0"
						}
					},
					d: true
				},
				y: {
					z: {
						c: {
							e: {
								f: "str: 0"
							}
						},
						d: true
					}
				}
			});
			expect(json).toEqual({
				a: { x: 0, y: "str", z: true },
				b: {
					c: {
						e: {
							f: "str: ${self:a.x}"
						}
					},
					d: "${self:a.z}"
				},
				y: {
					z: "${self:b}"
				}
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				o: {
					a: [ 2, 4, 8, 16 ]
				},

				r1: "${self:o.a[2]}",
				r2: "${self:o.a[0]}"
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				o: {
					a: [ 2, 4, 8, 16 ]
				},

				r1: 8,
				r2: 2
			});
			expect(json).toEqual({
				o: {
					a: [ 2, 4, 8, 16 ]
				},

				r1: "${self:o.a[2]}",
				r2: "${self:o.a[0]}"
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				x: "123",
				o: {
					a: [ 2, '${self:x}', 8, 16 ]
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				x: "123",
				o: {
					a: [ 2, "123", 8, 16 ]
				}
			});
			expect(json).toEqual({
				x: "123",
				o: {
					a: [ 2, '${self:x}', 8, 16 ]
				}
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				o: {
					a: [ 2, '${self:o.a[3]}', 8, 16 ]
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				o: {
					a: [ 2, 16, 8, 16 ]
				}
			});
			expect(json).toEqual({
				o: {
					a: [ 2, '${self:o.a[3]}', 8, 16 ]
				}
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				x: "123",
				o: {
					a: [ 2, { oo: { b: '${self:x}'} }, 8, 16 ]
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				x: "123",
				o: {
					a: [ 2, { oo: { b: '123'} }, 8, 16 ]
				}
			});
			expect(json).toEqual({
				x: "123",
				o: {
					a: [ 2, { oo: { b: '${self:x}'} }, 8, 16 ]
				}
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				x: "123",
				o: {
					a: [ 2, [ 1, ['a', '${self:x}', 'c' ], 3 ], 8, 16 ]
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				x: "123",
				o: {
					a: [ 2, [ 1, ['a', '123', 'c' ], 3 ], 8, 16 ]
				}
			});
			expect(json).toEqual({
				x: "123",
				o: {
					a: [ 2, [ 1, ['a', '${self:x}', 'c' ], 3 ], 8, 16 ]
				}
			});
		});

		it("should resolve all references.", function()
		{
			const json = {
				a: 2,
				b: "${self:a}",
				bb: "blah, blah",
				o1: {
					d: true,
					e: [ 1, 2, 3, 4 ],
					b: "XX ${self:o1.o2.g} + ${self:a} ",
					o2: {
						g: 0.99
					}
				}
			};

			const config = new Hookney(json).resolveReferences().json();

			expect(config).toEqual({
				a: 2,
				b: 2,
				bb: "blah, blah",
				o1: {
					d: true,
					e: [ 1, 2, 3, 4 ],
					b: "XX 0.99 + 2 ",
					o2: {
						g: 0.99
					}
				}
			});
			expect(json).toEqual({
				a: 2,
				b: "${self:a}",
				bb: "blah, blah",
				o1: {
					d: true,
					e: [ 1, 2, 3, 4 ],
					b: "XX ${self:o1.o2.g} + ${self:a} ",
					o2: {
						g: 0.99
					}
				}
			});
		});

		it("should resolve all references.", function()
		{
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

			expect(config).toEqual({
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

				config: {
					// Scenario 'mid'
					limit: '500kb',
					strict: true,
					extended: false
				}
			});
			expect(json).toEqual({
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
			});
		});
	});
});
