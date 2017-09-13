'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const _slicedToArray = function () { function sliceIterator(arr, i) { const _arr = []; let _n = true; let _d = false; let _e; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i.return) _i.return(); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); }  throw new TypeError("Invalid attempt to destructure non-iterable instance");  }; }();

const _extends = Object.assign || function (target) { for (let i = 1; i < arguments.length; i++) { const source = arguments[i]; for (const key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const getPatterns = (() => {
  const _ref = _asyncToGenerator(function* (options, cache) {
    const cmds = arguments.length <= 2 || arguments[2] === undefined ? ['read', 'transform'] : arguments[2];

    const settings = _extends({}, defaults, options);

    const id = settings.id;
    const base = settings.base;
    const config = settings.config;
    const factory = settings.factory;
    const transforms = settings.transforms;
    const filters = settings.filters;
    const log = settings.log;
    const isEnvironment = settings.isEnvironment;


    const path = (0, _path.resolve)(base, id);
    const staticCacheRoot = (0, _path.resolve)(process.cwd(), '.cache');
    config.log = log;

    // No patterns to find here
    if (!(yield (0, _pathExists2.default)(path))) {
      debug(`Expected path ${path} for pattern ${id} does not exist.`);
      return [];
    }

    const search = (yield (0, _pathExists2.default)((0, _path.resolve)(path, 'pattern.json'))) ? (0, _path.resolve)(path, 'pattern.json') : path;

    // Get all pattern ids
    const paths = yield (0, _readTree2.default)(search, options.cache);

    const patternIDs = paths.filter((item) => {
      return (0, _path.basename)(item) === 'pattern.json';
    }).filter((item) => {
      return isEnvironment ? true : !item.includes('@environments');
    }).map((item) => {
      return (0, _path.dirname)(item);
    }).map((item) => {
      return (0, _path.relative)(options.base, item);
    });

    // Read and transform patterns at a concurrency of 5
    return yield Promise.all(patternIDs.map((0, _throat2.default)(5, (() => {
      const _ref2 = _asyncToGenerator(function* (patternID) {
        // Try to use the static cache
        const cached = cache.config.static ? yield (0, _getStaticCacheItem2.default)({
          id: patternID,
          base: staticCacheRoot,
          filters,
          cache
        }) : null;

        if (cached) {
          return cached;
        }

        // Load user environments
        const userEnvironments = yield (0, _getEnvironments2.default)(base, {
          cache,
          log
        });

        const free = typeof filters.environments === 'undefined' || filters.environments.length === 0;

        // Get environments that match this pattern
        const matchingEnvironments = free ? (0, _getMatchingEnvironments2.default)(patternID, userEnvironments) : userEnvironments.filter((_ref3) => {
          const name = _ref3.name;
          return filters.environments.includes(name);
        });

        // Get the available environment names for this pattern
        const environmentNames = matchingEnvironments.map((env) => {
          return env.name;
        });

        if (environmentNames.length > 0) {
          log.debug(`Applying environments ${_chalk2.default.bold(environmentNames.join(', '))} to ${_chalk2.default.bold(patternID)}`);
        }

        // Merge environment configs
        // fall back to default environment if none is matching
        const environmentsConfig = matchingEnvironments.reduce((results, environmentConfig) => {
          const environment = environmentConfig.environment;

          const misplacedKeys = (0, _lodash.omit)(environment, Object.keys(config));
          const misplacedKeyNames = Object.keys(misplacedKeys);

          if (misplacedKeys.length > 0) {
            log.warn([`${_chalk2.default.yellow('[⚠ Deprecation ⚠ ]')} Found unexpected keys ${misplacedKeyNames} in environment`, `${environmentConfig.name}.environment. Placing keys other than ${Object.keys(config)} in`, `${environmentConfig.name}.environment is deprecated, move the keys to`, `${environmentConfig.name}.environment.transforms`].join(' '));
          }

          // Directly stuff mismatching keys into transforms config to retain previous behaviour
          return (0, _lodash.omit)((0, _lodash.merge)({}, results, (0, _lodash.omit)(environment, misplacedKeyNames), {
            transforms: misplacedKeys
          }), Object.keys(misplacedKeys).concat(Object.keys(_getEnvironments.DEFAULT_ENVIRONMENT)));
        }, _getEnvironments.DEFAULT_ENVIRONMENT);

        envDebug('applying env config to pattern %s', patternID);
        envDebug('%s', (0, _util.inspect)(environmentsConfig, { depth: null }));

        // Merge the determined environments config onto the pattern config
        const patternConfiguration = (0, _lodash.merge)({}, config, environmentsConfig, {
          environments: environmentNames,
          options: settings.options || {}
        });

        // Initialize the pattern object
        const initStart = new Date();
        const filterString = JSON.stringify(filters);
        const filterStamp = _chalk2.default.grey(`[${filterString}]`);
        log.debug(`Initializing pattern "${patternID}" with filters: ${filterStamp}`);
        const pattern = yield factory(patternID, base, patternConfiguration, transforms, filters);
        log.debug(`Initialized pattern "${patternID}" ${_chalk2.default.grey(`[${new Date() - initStart}ms]`)}`);

        // Inject information about available environments
        const availableEnvironments = userEnvironments.map((env) => {
          return (0, _lodash.pick)(env, ['name', 'displayName']);
        });

        // Select environments that should be displayed
        const demoEnvironments = userEnvironments.filter((env) => {
          return env.display;
        }).map((env) => {
          return (0, _lodash.pick)(env, ['name', 'displayName']);
        });

        pattern.manifest.availableEnvironments = availableEnvironments.length ? availableEnvironments : [(0, _lodash.pick)(_getEnvironments.DEFAULT_ENVIRONMENT, ['name', 'displayName'])];

        pattern.manifest.demoEnvironments = demoEnvironments.length ? demoEnvironments : [(0, _lodash.pick)(_getEnvironments.DEFAULT_ENVIRONMENT, ['name', 'displayName'])];

        // Determine dependening patterns

        const _ref4 = yield (0, _getDependentPatterns2.default)(patternID, base, { cache });

        const _ref5 = _slicedToArray(_ref4, 2);

        const errors = _ref5[0];
        const depending = _ref5[1];


        if (errors) {
          // Throw new Error(errors.map(e => e.message).join('\n'));
        }

        pattern.manifest.dependentPatterns = depending;

        // Exit if we do not have to read
        if (!cmds.includes('read')) {
          // Inject depending pattern information
          return pattern;
        }

        // Read the pattern files
        const readStart = new Date();
        log.debug(`Reading pattern "${patternID}"`);
        yield pattern.read();

        log.debug(`Read pattern "${patternID}" ${_chalk2.default.grey(`[${new Date() - readStart}ms]`)}`);

        // Exit if we do not have to transform
        if (!cmds.includes('transform')) {
          return pattern;
        }

        // Transform pattern sources
        const transformStart = new Date();
        log.debug(`Transforming pattern "${patternID}"`);
        const transformed = yield pattern.transform(!isEnvironment, isEnvironment);
        log.debug(`Transformed pattern "${patternID}" ${_chalk2.default.grey(`[${new Date() - transformStart}ms]`)}`);
        return transformed;
      });

      return function (_x4) {
        return _ref2.apply(this, arguments);
      };
    })())));
  });

  return function getPatterns(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

var _path = require('path');

var _util = require('util');

const _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

const _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

var _lodash = require('lodash');

const _throat = require('throat');

var _throat2 = _interopRequireDefault(_throat);

var _getEnvironments = require('./get-environments');

var _getEnvironments2 = _interopRequireDefault(_getEnvironments);

const _getDependentPatterns = require('./get-dependent-patterns');

var _getDependentPatterns2 = _interopRequireDefault(_getDependentPatterns);

const _getStaticCacheItem = require('./get-static-cache-item.js');

var _getStaticCacheItem2 = _interopRequireDefault(_getStaticCacheItem);

const _getMatchingEnvironments = require('./get-matching-environments');

var _getMatchingEnvironments2 = _interopRequireDefault(_getMatchingEnvironments);

const _readTree = require('../filesystem/read-tree');

var _readTree2 = _interopRequireDefault(_readTree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { const gen = fn.apply(this, arguments); return new Promise((resolve, reject) => { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then((value) => { step("next", value); }, (err) => { step("throw", err); }); } } return step("next"); }); }; }

const envDebug = (0, _util.debuglog)('environments');
const debug = (0, _util.debuglog)('get-patterns');

const defaults = {
  isEnvironment: false,
  filters: {},
  log: function log() {}
};

exports.default = getPatterns;
module.exports = exports.default;