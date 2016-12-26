'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;

const addAccount = (() => {
  var _ref = _asyncToGenerator(function* (type, options) {
    if (type === 1) {
      yield knex('account_plugin').insert({
        type: 1,
        userId: options.user,
        port: options.port,
        password: options.password
      });
      return;
    }
  });

  return function addAccount(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const getAccount = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    const account = yield knex('account_plugin').select();
    return account;
  });

  return function getAccount() {
    return _ref2.apply(this, arguments);
  };
})();

exports.addAccount = addAccount;
exports.getAccount = getAccount;

// const checkServer = async () => {
//   const account = await knex('account_plugin').select();
//   account.forEach(f => {
//
//   });
// };