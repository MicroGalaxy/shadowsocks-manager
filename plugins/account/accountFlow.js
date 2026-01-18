const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const { createHash } = require('crypto');

const add = async accountId => {
const servers = await knex('server').select();
const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);

let filteredServers = servers;  // 默认使用原始 servers
if (accountInfo.server != null && accountInfo.server != '') {
  const serverIds = JSON.parse(accountInfo.server);
  filteredServers = servers.filter(server => serverIds.includes(server.id));
}

  const addAccountFlow = async (server, accountId) => {
    const accountFlowInfo = await knex('account_flow').where({ serverId: server.id, accountId }).then(s => s[0]);
    if(accountFlowInfo) { return; }
    await knex('account_flow').insert({
      serverId: server.id,
      accountId,
      port: accountInfo.port + server.shift,
      nextCheckTime: Date.now(),
    });
  };
  await Promise.all(filteredServers.map(server => {
    return addAccountFlow(server, accountId);
  }));
  return;
};

const del = async accountId => {
  await knex('account_flow').delete().where({ accountId });
  return;
};

const pwd = async (accountId, password) => {
  const servers = await knex('server').select();
  let accountServers = servers;
  const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
  if(accountInfo.server) {
    accountServers = servers.filter(f => {
      return JSON.parse(accountInfo.server).indexOf(f.id) >= 0;
    });
  }
  accountServers.forEach(server => {
    if(server.type === 'WireGuard') {
      let publicKey = accountInfo.key;
      if(!publicKey) {
        return;
      }
      if(publicKey.includes(':')) {
        publicKey = publicKey.split(':')[0];
      }
      manager.send({
        command: 'pwd',
        port: accountInfo.port + server.shift,
        password: publicKey,
      }, {
        host: server.host,
        port: server.port,
        password: server.password,
      });
    } else if(server.type === 'Trojan') {
      const pwd = createHash('sha224')
        .update(`${accountInfo.port}:${password}`, 'utf8')
        .digest('hex');
      manager.send({
        command: 'add',
        port: accountInfo.port,
        password: pwd,
      }, {
        host: server.host,
        port: server.port,
        password: server.password,
      });
    } else if(server.type === 'Shadowsocks'){
      manager.send({
        command: 'pwd',
        port: accountInfo.port + server.shift,
        password,
      }, {
        host: server.host,
        port: server.port,
        password: server.password,
      });
    }
  });
};

const edit = async accountId => {
  const servers = await knex('server').select();
  let filteredServers = servers;  // 默认使用原始 servers
  const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
  if (accountInfo.server != null && accountInfo.server != '') {
    const serverIds = JSON.parse(accountInfo.server);
    filteredServers = servers.filter(server => serverIds.includes(server.id));
  }
  await Promise.all(filteredServers.map(async (server) => {
  const result = await knex('account_flow').where({
    serverId: server.id,
    accountId: accountInfo.id
  });
  const exists = result[0]; // 或使用 .first() 方法：const exists = await knex('account_flow').where({...}).first();
  
  if (!exists) {
    return knex('account_flow').insert({
      serverId: server.id,
      accountId: accountInfo.id,
      port: accountInfo.port + server.shift,
      nextCheckTime: Date.now(),
    });
  } else {
    return knex('account_flow').update({
      port: accountInfo.port + server.shift,
      nextCheckTime: Date.now(),
    }).where({
      serverId: server.id,
      accountId: accountInfo.id,
    });
  }
}));
  return;
};

const server = async serverId => {
  const server = await knex('server').where({ id: serverId }).then(s => s[0]);
  const accounts = await knex('account_plugin').where({});
  const filteredAccounts = accounts.filter(account => {
  try {
    // 如果 server 是 null 或空字符串，代表所有服务器，直接返回 true
    if (account.server === null || account.server === '') {
      return true;
    }
    // 解析 server 字符串为 JSON 数组
    const serverArray = JSON.parse(account.server);
    
    // 检查是否包含 serverId（serverArray 是数组，serverId 是数字）
    return Array.isArray(serverArray) && serverArray.includes(serverId);
  } catch (error) {
    // 如果解析失败（无效 JSON），跳过或记录错误
    return false;
  }
});
  for(const account of filteredAccounts) {
    const exists = await knex('account_flow').where({
      serverId,
      accountId: account.id
    }).then(s => s[0]);
    if(!exists) {
      await knex('account_flow').insert({
        serverId: server.id,
        accountId: account.id,
        port: account.port + server.shift,
        nextCheckTime: Date.now(),
      });
    } else {
      await knex('account_flow').update({
        port: account.port + server.shift,
        nextCheckTime: Date.now(),
      }).where({
        serverId: server.id,
        accountId: account.id,
      });
    }
  }
  // 构建 filteredAccounts 的 accountId 集合，用于高效查找
  const filteredAccountIds = new Set(filteredAccounts.map(account => account.id));
  // 新增：删除 account 中不包含此服务器的 account_flow 记录
  // 先查询所有此服务器的 account_flow 记录
  const allAccountFlows = await knex('account_flow').where({ serverId: server.id });
  const accountsToDelete = allAccountFlows.filter(flow => !filteredAccountIds.has(flow.accountId));
  
  if (accountsToDelete.length > 0) {
    // 批量删除（使用 whereIn 更高效）
    const accountIdsToDelete = accountsToDelete.map(flow => flow.accountId);
    const deletedCount = await knex('account_flow')
      .where({ serverId: server.id })
      .whereIn('accountId', accountIdsToDelete)
      .delete();
    console.log(`已删除 ${deletedCount} 条不包含的服务器记录`);
  }
};

const updateFlow = async (serverId, accountId, flow) => {
  const exists = await knex('account_flow').where({
    serverId,
    accountId,
  }).then(success => success[0]);
  if(!exists) { return; }
  await knex('account_flow').update({
    flow: exists.flow + flow,
    updateTime: Date.now(),
  }).where({
    serverId,
    accountId,
  });
};

exports.add = add;
exports.del = del;
exports.pwd = pwd;
exports.edit = edit;
exports.addServer = server;
exports.editServer = server;
exports.updateFlow = updateFlow;
