const core = require('./coreController');
const imports = require('./importController');
const accounts = require('./accountController');

module.exports = {
  ...core,
  ...imports,
  ...accounts
};
