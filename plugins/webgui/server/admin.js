const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const user = appRequire('plugins/user/index');
const knex = appRequire('init/knex').knex;
const alipay = appRequire('plugins/alipay/index');
const paypal = appRequire('plugins/paypal/index');
const email = appRequire('plugins/email/index');
const config = appRequire('services/config').all();
const isAlipayUse = config.plugins.alipay && config.plugins.alipay.use;
const isPaypalUse = config.plugins.paypal && config.plugins.paypal.use;
const rp = require('request-promise');
const macAccount = appRequire('plugins/macAccount/index');
const refOrder = appRequire('plugins/webgui_ref/order');
const refUser = appRequire('plugins/webgui_ref/user');
const flowPack = appRequire('plugins/webgui_order/flowPack');
const accountFlow = appRequire('plugins/account/accountFlow');

exports.getAccount = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  account.getAccount({ group }).then(success => {
    success.forEach(account => {
      account.data = JSON.parse(account.data);
      if(account.type >= 2 && account.type <= 5) {
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        account.data.expire = account.data.create + account.data.limit * time[account.type];
        account.data.from = account.data.create;
        account.data.to = account.data.create + time[account.type];
        while(account.data.to <= Date.now()) {
          account.data.from = account.data.to;
          account.data.to = account.data.from + time[account.type];
        }
      }
    });
    success.sort((a, b) => {
      return a.port >= b.port ? 1 : -1;
    });
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOnlineAccount = (req, res) => {
  const serverId = req.query.serverId ? +req.query.serverId : 0;
  account.getOnlineAccount(serverId).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountByPort = async (req, res) => {
  try {
    const port = +req.params.port;
    const accountInfo = await account.getAccount({ port }).then(s => s[0]);
    if(!accountInfo) { return Promise.reject('account not found'); }
    if(accountInfo.data) {
      accountInfo.data = JSON.parse(accountInfo.data);
    }
    res.send(accountInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOneAccount = async (req, res) => {
  try {
    const accountId = +req.params.accountId;
    const accountInfo = await account.getAccount({ id: accountId }).then(s => s[0]);
    if(!accountInfo) {
      return Promise.reject('account not found');
    }
    accountInfo.data = JSON.parse(accountInfo.data);
    accountInfo.server = accountInfo.server ? JSON.parse(accountInfo.server) : accountInfo.server;
    if(accountInfo.type >= 2 && accountInfo.type <= 5) {
      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      accountInfo.data.expire = accountInfo.data.create + accountInfo.data.limit * time[accountInfo.type];
      accountInfo.data.from = accountInfo.data.create;
      accountInfo.data.to = accountInfo.data.create + time[accountInfo.type];
      while(accountInfo.data.to <= Date.now()) {
        accountInfo.data.from = accountInfo.data.to;
        accountInfo.data.to = accountInfo.data.from + time[accountInfo.type];
      }
      accountInfo.data.flowPack = await flowPack.getFlowPack(accountId, accountInfo.data.from, accountInfo.data.to);
    }
    accountInfo.publicKey = '';
    accountInfo.privateKey = '';
    if(accountInfo.key) {
      if(accountInfo.key.includes(':')) {
        accountInfo.publicKey = accountInfo.key.split(':')[0];
        accountInfo.privateKey = accountInfo.key.split(':')[1];
      } else {
        accountInfo.publicKey = accountInfo.key;
      }
    }
    await accountFlow.edit(accountInfo.id);

    const onlines = await account.getOnlineAccount();
    const serversWithoutWireGuard = await knex('server').select(['id']).where({ type: 'Shadowsocks' }).then(s => s.map(m => m.id));
    accountInfo.idle = serversWithoutWireGuard.filter(server => {
      if(accountInfo.server) {
        return accountInfo.server.includes(server);
      }
      return true;
    }).sort((a, b) => {
      return (onlines[a] || 0)  - (onlines[b] || 0);
    })[0];
    return res.send(accountInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  };
};

exports.addAccount = (req, res) => {
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('time', 'Invalid time').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const type = +req.body.type;
      const orderId = +req.body.orderId;
      const port = +req.body.port;
      const password = req.body.password;
      const time = req.body.time;
      const limit = +req.body.limit;
      const flow = +req.body.flow;
      const autoRemove = +req.body.autoRemove || 0;
      const autoRemoveDelay = +req.body.autoRemoveDelay || 0;
      const multiServerFlow = +req.body.multiServerFlow || 0;
      const server = req.body.server ? JSON.stringify(req.body.server) : null;
      const user = req.body.user || null;
      return account.addAccount(type, {
        port, password, time, limit, flow, autoRemove, autoRemoveDelay, server, multiServerFlow, orderId,
        user,
      });
    }
    result.throw();
  }).then(success => {
    res.send({ id: success });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteAccount = (req, res) => {
  const accountId = req.params.accountId;
  account.delAccount(accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.changeAccountPort = (req, res) => {
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const accountId = req.params.accountId;
      const port = +req.body.port;
      return account.changePort(accountId, port);
    }
    result.throw();
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.changeAccountData = (req, res) => {
  const accountId = req.params.accountId;
  account.editAccount(accountId, {
    type: req.body.type,
    orderId: req.body.orderId,
    port: req.body.port,
    password: req.body.password,
    time: req.body.time,
    limit: +req.body.limit,
    flow: +req.body.flow,
    autoRemove: +req.body.autoRemove,
    autoRemoveDelay: +req.body.autoRemoveDelay,
    multiServerFlow: +req.body.multiServerFlow,
    server: req.body.server,
    active: req.body.active,
  }).then(success => {
    if(req.body.cleanFlow) {
      flow.cleanAccountFlow(accountId);
    }
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.changeAccountTime = (req, res) => {
  const accountId = req.params.accountId;
  const time = req.body.time;
  const check = req.body.check;
  account.editAccountTime(accountId, time, check).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.renewAccount = async (req, res) => {
  try {
    const accountId = +req.params.accountId;
    const accountInfo = await account.getAccount({ id: accountId }).then(s => s[0]);
    let renewCycle = 1;
    if (accountInfo && accountInfo.orderCycle) {
      renewCycle = accountInfo.orderCycle;
    }
    await account.addAccountLimit(accountId, renewCycle);
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getRecentSignUpUsers = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  const number = req.query.number ? +req.query.number : 5;
  user.getRecentSignUp(number, group).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRecentLoginUsers = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  const number = req.query.number ? +req.query.number : 5;
  user.getRecentLogin(number, group).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getExpiringSoonAccounts = async (req, res) => {
  try {
    const number = req.query.number ? +req.query.number : 100;
    const sevenDaysLater = new Date(new Date().setHours(23, 59, 59, 999) + 7 * 24 * 60 * 60 * 1000).getTime();
    
    // 使用现有的 accountWithPage 逻辑获取所有账号
    const accounts = await account.getAccountAndPaging({
      page: 1,
      pageSize: 5000, // 获取足够多的数据
      search: '',
      sort: 'port_asc',
      filter: {
        expired: true,
        unexpired: true,
        unlimit: true,
        mac: true,
        orderId: 0,
        hasUser: true,
        noUser: true,
      },
    });
    
    const now = Date.now();
    const expiringSoonAccounts = [];
    
    accounts.account.forEach(a => {
      if (a.data && a.data.expire && a.data.expire > now && a.data.expire <= sevenDaysLater) {
        expiringSoonAccounts.push(a);
      }
    });
    
    // Sort by expire time (earliest first)
    expiringSoonAccounts.sort((a, b) => a.data.expire - b.data.expire);
    
    return res.send(expiringSoonAccounts.slice(0, number));
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getRecentOrders = (req, res) => {
  if(!isAlipayUse) {
    return res.send([]);
  }
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  alipay.orderListAndPaging({
    pageSize: 5,
    group,
  }).then(success => {
    return res.send(success.orders);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalRecentOrders = (req, res) => {
  if(!isPaypalUse) {
    return res.send([]);
  }
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  paypal.orderListAndPaging({
    pageSize: 5,
    group,
  }).then(success => {
    return res.send(success.orders);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteUser = (req, res) => {
  const userId = req.params.userId;
  user.delete(userId).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserAccount = (req, res) => {
  account.getAccount().then(success => {
    success = success.filter(f => {
      return !f.userId;
    });
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.setUserAccount = (req, res) => {
  const userId = req.params.userId;
  const accountId = req.params.accountId;
  account.editAccount(accountId, { userId }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteUserAccount = (req, res) => {
  const userId = req.params.userId;
  const accountId = req.params.accountId;
  macAccount.getAccountByAccountId(accountId).then(macAccounts => {
    if(macAccounts.length) {
      return res.status(403).end();
    }
    return account.editAccount(accountId, { userId: null });
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserOrders = (req, res) => {
  if(!isAlipayUse) {
    return res.send([]);
  }
  const options = {
    userId: +req.params.userId,
  };
  alipay.orderList(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserRefOrders = (req, res) => {
  const userId = +req.params.userId;
  refOrder.getUserOrders(userId)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalUserOrders = (req, res) => {
  if(!isPaypalUse) {
    return res.send([]);
  }
  const options = {
    userId: +req.params.userId,
  };
  paypal.orderList(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOrders = (req, res) => {
  if(!isAlipayUse) {
    return res.send({
      maxPage: 0,
      page: 1,
      pageSize: 0,
      total: 0,
      orders: [],
    });
  }
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'alipay.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;
  
  options.filter = ( Array.isArray(req.query.filter) ? req.query.filter : [req.query.filter] ) || [];
  alipay.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getCsvOrders = async (req, res) => {
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'alipay.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;

  options.filter = ( Array.isArray(req.query.filter) ? req.query.filter : [req.query.filter] ) || [];
  alipay.getCsvOrder(options)
  .then(success => {
    res.setHeader('Content-disposition', 'attachment; filename=download.csv');
    res.setHeader('Content-type', 'text/csv');
    res.send(success.map(m => {
      return `${ m.orderId }, ${ m.amount }, ${ m.username }`;
    }).join('\r\n'));
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRefOrders = (req, res) => {
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'webgui_ref_time.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;
  
  options.filter = req.query.filter || '';
  refOrder.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalOrders = (req, res) => {
  if(!isPaypalUse) {
    return res.send({
      maxPage: 0,
      page: 1,
      pageSize: 0,
      total: 0,
      orders: [],
    });
  }
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'paypal.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;

  options.filter = req.query.filter || '';
  paypal.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalCsvOrders = async (req, res) => {
  res.send('PP');
};

exports.getUserPortLastConnect = (req, res) => {
  const accountId = +req.params.accountId;
  flow.getUserPortLastConnect(accountId).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.sendUserEmail = (req, res) => {
  const userId = +req.params.userId;
  const title = req.body.title;
  const content = req.body.content;
  req.checkBody('title', 'Invalid title').notEmpty();
  req.checkBody('content', 'Invalid content').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      return user.getOne(userId).then(user => user.email);
    }
    result.throw();
  }).then(emailAddress => {
    return email.sendMail(emailAddress, title, content, {
      type: 'user',
    });
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountIp = (req, res) => {
  const accountId = +req.params.accountId;
  const serverId = +req.params.serverId;
  let serverInfo;
  knex('server').select().where({
    id: serverId,
  }).then(success => {
    if(success.length) {
      serverInfo = success[0];
    } else {
      return Promise.reject('server not found');
    }
    return account.getAccount({ id: accountId }).then(success => success[0]);
  }).then(accountInfo => {
    const port = accountInfo.port;
    return manager.send({
      command: 'ip',
      port: port + serverInfo.shift,
    }, {
      host: serverInfo.host,
      port: serverInfo.port,
      password: serverInfo.password,
    });
  }).then(ip => {
    return res.send({ ip });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountIpFromAllServer = (req, res) => {
  const accountId = +req.params.accountId;
  let accountInfo;
  account.getAccount({ id: accountId }).then(success => {
    accountInfo = success[0];
    return knex('server').select().where({});
  }).then(servers => {
    const getIp = (port, serverInfo) => {
      return manager.send({
        command: 'ip',
        port: port + serverInfo.shift,
      }, {
        host: serverInfo.host,
        port: serverInfo.port,
        password: serverInfo.password,
      });
    };
    const promiseArray = servers.map(server => {
      return getIp(accountInfo.port, server).catch(err => []);
    });
    return Promise.all(promiseArray);
  }).then(ips => {
    const result = [];
    ips.forEach(ip => {
      (ip || []).forEach(i => {
        if(result.indexOf(i) < 0) { result.push(i); }
      });
    });
    return res.send({ ip: result });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountIpInfo = (req, res) => {
  const ip = req.params.ip;

  const taobao = ip => {
    const uri = `http://ip.taobao.com/service/getIpInfo.php?ip=${ ip }`;
    return rp({ uri, timeout: 10 * 1000 }).then(success => {
      const decode = (s) => {
        return unescape(s.replace(/\\u/g, '%u'));
      };
      return JSON.parse(decode(success));
    }).then(success => {
      if(success.code !== 0) {
        return Promise.reject(success.code);
      }
      const result = [success.data.region + (success.data.region === success.data.city ? '' : success.data.city), success.data.isp];
      return result;
    });
  };

  const sina = ip => {
    const uri = `https://int.dpool.sina.com.cn/iplookup/iplookup.php?format=js&ip=${ ip }`;
    return rp({ uri, timeout: 10 * 1000 }).then(success => {
      const decode = (s) => {
        return unescape(s.replace(/\\u/g, '%u'));
      };
      return JSON.parse(decode(success.match(/^var remote_ip_info = ([\s\S]+);$/)[1]));
    }).then(success => {
      const result = [success.province + success.city, success.isp];
      return result;
    });
  };

  const ipip = ip => {
    const uri = `https://freeapi.ipip.net/${ ip }`;
    return rp({ uri, timeout: 10 * 1000 }).then(success => {
      const decode = (s) => {
        return unescape(s.replace(/\\u/g, '%u'));
      };
      return JSON.parse(decode(success));
    }).then(success => {
      const result = [success[1] + success[2], success[4]];
      return result;
    });
  };

  const getIpFunction = ip => {
    return taobao(ip).catch(() => {
      return sina(ip);
    }).catch(() => {
      return ipip(ip);
    });
  };
  getIpFunction(ip)
  .then(success => {
    return res.send(success);
  }).catch(err => {
    return res.send(['', '']);
  });
};

exports.getAllMacAccount = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  macAccount.getAllAccount(group).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.resetAccountFlow = (req, res) => {
  const accountId = +req.params.accountId;
  flow.cleanAccountFlow(accountId).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addFlowPack = async (req, res) => {
  try {
    const accountId = +req.params.accountId;
    const orderId = +req.body.orderId;
    const createTime = +req.body.createTime || Date.now();

    const order = await knex('webgui_order').where({ id: orderId }).first();
    if (!order) {
      return res.status(404).send('Order not found');
    }

    await knex('webgui_flow_pack').insert({
      accountId,
      flow: order.flow,
      createTime: createTime,
    });
    await accountFlow.edit(accountId);
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.newPortForAddAccount = async (req, res) => {
  try {
    const setting = await knex('webguiSetting').where({ key: 'account' }).first();
    if (!setting) throw new Error('settings not found');
    const portConfig = JSON.parse(setting.value).port;

    const candidatePorts = [];
    for (let i = portConfig.start; i <= portConfig.end; i++) {
      candidatePorts.push(i);
    }

    const usedPorts = await knex('account_plugin').select('port');
    const usedPortSet = new Set(usedPorts.map(u => u.port));

    const availablePorts = candidatePorts.filter(p => !usedPortSet.has(p));

    if (availablePorts.length === 0) {
      throw new Error('no port');
    }

    let newPort;
    if (portConfig.random) {
      newPort = availablePorts[Math.floor(Math.random() * availablePorts.length)];
    } else {
      availablePorts.sort((a, b) => a - b);
      newPort = availablePorts[0];
    }

    res.send({ port: newPort });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getRefUserById = (req, res) => {
  const userId = +req.params.userId;
  refUser.getRefUser(userId).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRefCodeById = (req, res) => {
  const userId = +req.params.userId;
  refUser.getRefCode(userId)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addRefCodeForUser = async (req, res) => {
  try {
    const userId = +req.params.userId;
    const number = req.body.number;
    const max = req.body.max;
    for(let i = 0; i < number; i++) {
      await refUser.addRefCode(userId, max);
    }
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteRefCode = async (req ,res) => {
  try {
    const code = req.params.code;
    await refUser.deleteRefCode(code);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteRefUser = async (req, res) => {
  try {
    const sourceUserId = +req.params.sourceUserId;
    const refUserId = +req.params.refUserId;
    await refUser.deleteRefUser(sourceUserId, refUserId);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.alipayRefund = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const amount = req.body.amount;
    const result = await alipay.refund(orderId, amount);
    res.send(result);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getAccountAndPaging = async (req, res) => {
  try {
    const page = +req.body.page || 1;
    const pageSize = +req.body.pageSize || 20;
    const sort = req.body.sort;
    const search = req.body.search || '';
    const filter = req.body.filter;
    const accounts = await account.getAccountAndPaging({
      page,
      pageSize,
      search,
      sort,
      filter,
    });
    return res.send(accounts);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getLast5MinFlow = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const pageSize = +req.query.pageSize || 20; // 默认每页20条
    const offset = (page - 1) * pageSize;

    const totalCountResult = await knex('v_last_5min_flow').count('* as total');
    const totalCount = totalCountResult[0].total;

    // 计算所有数据的总流量
    const totalFlowResult = await knex('v_last_5min_flow').sum('total_flow_mb as totalFlow');
    const totalFlow = totalFlowResult[0].totalFlow || 0;

    const result = await knex('v_last_5min_flow')
      .select()
      .orderBy('total_flow_mb', 'desc')
      .limit(pageSize)
      .offset(offset);

    return res.send({
      data: result,
      totalCount: totalCount,
      totalFlow: totalFlow, // 添加总流量字段
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getTop5MinFlow = async (req, res) => {
  try {
    const result = await knex('v_last_5min_flow')
      .select()
      .orderBy('total_flow_mb', 'desc')
      .limit(5); // 硬编码限制为5条
    return res.send(result);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getSharedIpRecords = async (req, res) => {
  try {
    const port = req.params.port;
    const records = await knex('t_share_port_record')
      .where({ port: port })
      .orderBy('time', 'desc');
    res.send(records);
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.getSharedIpStats = async (req, res) => {
  try {
    // 获取最近一周的时间范围（datetime格式）
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    
    // 统计最近一周每个端口的共享IP出现次数，并关联账号信息，只统计active为1的账号
    const stats = await knex('t_share_port_record as spr')
      .select('spr.port', 'a.id as accountId')
      .count('* as sharedCount')
      .leftJoin('account_plugin as a', 'spr.port', 'a.port')
      .where('spr.time', '>', oneWeekAgo)
      .where('a.active', 1)
      .groupBy('spr.port', 'a.id')
      .orderBy('sharedCount', 'desc')
      .limit(pageSize)
      .offset(offset);
    
    // 获取总记录数，只统计active为1的账号
    const totalCount = await knex('t_share_port_record as spr')
      .countDistinct('spr.port as total')
      .leftJoin('account_plugin as a', 'spr.port', 'a.port')
      .where('spr.time', '>', oneWeekAgo)
      .where('a.active', 1)
      .first();
    
    res.send({
      data: stats,
      totalCount: parseInt(totalCount.total) || 0,
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil((parseInt(totalCount.total) || 0) / pageSize)
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteSharedIpRecords = async (req, res) => {
  try {
    const port = req.params.port;
    await knex('t_share_port_record')
      .where({ port: port })
      .del();
    res.send({ message: '所有共享IP记录已成功删除' });
  } catch (err) {
    console.error('Failed to delete shared IP records', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const now = Date.now();
    const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;

    const accounts = await account.getAccount();
    
    let expiredCount = 0;
    let unexpiredCount = 0;
    let expiringSoonCount = 0;
    let usedPorts = new Set();

    accounts.forEach(acc => {
      usedPorts.add(acc.port);
      
      let data = acc.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch(e) { data = {}; }
      }
      
      // Calculate expire time similar to getAccount logic
      if(acc.type >= 2 && acc.type <= 5) {
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        if (!data.expire && data.create && data.limit) {
             data.expire = data.create + data.limit * time[acc.type];
        }
      }
      
      // Only count non-infinite accounts (type != 1) for expiration stats
      if (acc.type !== 1 && data && data.expire) {
        if (data.expire < now) {
          expiredCount++;
        } else {
          unexpiredCount++;
          if (data.expire < sevenDaysLater) {
            expiringSoonCount++;
          }
        }
      }
    });

    // Remaining Allocatable Accounts
    const accountSetting = await knex('webguiSetting').where({ key: 'account' }).first();
    let remainingPorts = 0;
    if (accountSetting) {
        try {
          const val = JSON.parse(accountSetting.value);
          if (val.port && val.port.start && val.port.end) {
            const totalPorts = val.port.end - val.port.start + 1;
            remainingPorts = totalPorts - usedPorts.size;
            if (remainingPorts < 0) remainingPorts = 0;
          }
        } catch (e) {}
    }

    // User Count
    const userCountResult = await knex('user').count('id as count').first();
    const userCount = userCountResult ? userCountResult.count : 0;

    // Server Count
    const servers = await knex('server').select();
    const serverCount = servers.length;
    
    // Offline Server Count
    let offlineServerCount = 0;
    const allTags = await knex('tag').where({ type: 'server' }).select('key', 'name');
    
    // Create a map of serverId -> tags
    const serverTags = {};
    allTags.forEach(tag => {
        if (!serverTags[tag.key]) {
            serverTags[tag.key] = [];
        }
        serverTags[tag.key].push(tag.name);
    });

    servers.forEach(server => {
        const tags = serverTags[server.id] || [];
        if (tags.includes('#pause') || tags.includes('#_pause')) {
            offlineServerCount++;
        }
    });

    res.send({
        expiredCount,
        unexpiredCount,
        expiringSoonCount,
        remainingPorts,
        userCount,
        serverCount,
        offlineServerCount
    });

  } catch (err) {
    console.log(err);
    res.status(500).send('Error getting system stats');
  }
};
