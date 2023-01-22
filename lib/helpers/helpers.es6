'use strict';

/**
 * Assembles log4js config from logging level map
 * @param {Object} [config] log4js config
 * @param {String} [config.defaultLevel = 'INFO'] Default logging level
 * @param {Object} [config.levels] Logging levels
 * @return {Object} Log4js config
 */
export function assembleLog4jsConfig(config = {}) {
  let appenders = {console: {type: 'console'}};
  let categories = {
    default: {
      appenders: Object.keys(appenders),
      level: config.defaultLevel || 'INFO'
    }
  };
  Object.keys(config.levels || {}).forEach((category) => {
    categories[category] = {
      appenders: Object.keys(appenders),
      level: config.levels[category]
    };
  });
  return {appenders, categories};
}
