const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const webguiTag = appRequire('plugins/webgui_tag');
const knex = appRequire('init/knex').knex;
const Client = require('ssh2').Client;

exports.getServers = (req, res) => {
  serverManager.list({
    status: !!req.query.status,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.getOneServer = (req, res) => {
  const serverId = req.params.serverId;
  const noPort = req.query.noPort;
  let result = null;
  knex('server').select().where({
    id: +serverId,
  }).then(success => {
    if(success.length) {
      result = success[0];
      if(noPort) { return; }
      return manager.send({
        command: 'list',
      }, {
        host: success[0].host,
        port: success[0].port,
        password: success[0].password,
      });
    }
    res.status(404).end();
  }).then(success => {
    if(success) { result.ports = success; }
    res.send(result);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.addServer = async (req, res) => {
  try {
    req.checkBody('type', 'Invalid type').notEmpty();
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('address', 'Invalid address').notEmpty();
    req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
    req.checkBody('password', 'Invalid password').notEmpty();
    req.checkBody('method', 'Invalid method').notEmpty();
    req.checkBody('scale', 'Invalid scale').notEmpty();
    req.checkBody('shift', 'Invalid shift').isInt();
    req.checkBody('ssh_port', 'Invalid ssh_port').isInt({min: 1, max: 65535});
    req.checkBody('ssh_user', 'Invalid ssh_user').notEmpty();
    req.checkBody('ssh_password', 'Invalid ssh_password').notEmpty();
    const result = await req.getValidationResult();
    if(!result.isEmpty()) { return Promise.reject(result.array()); }
    const type = req.body.type;
    const isWG = type === 'WireGuard';
    const isTj = type === 'Trojan';
    const name = req.body.name;
    const comment = req.body.comment;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    const shift = isWG ? 0 : req.body.shift;
    const key = isWG ? req.body.key : null;
    const net = isWG ? req.body.net: null;
    const wgPort = isWG ? req.body.wgPort : null;
    const tjPort = isTj ? req.body.tjPort : null;
    const pluginOptions = req.body.pluginOptions;
    const ssh_port = +req.body.ssh_port;
    const ssh_user = req.body.ssh_user;
    const ssh_password = req.body.ssh_password;
    await manager.send({
      command: 'flow',
      options: { clear: false, },
    }, {
      host: address,
      port,
      password,
    });
    const [ serverId ] = await serverManager.add({
      type,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift,
      key,
      net,
      wgPort,
      tjPort,
      pluginOptions,
      ssh_port,
      ssh_user,
      ssh_password,
    });
    res.send({ serverId });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.editServer = async (req, res) => {
  try {
    req.checkBody('type', 'Invalid type').notEmpty();
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('address', 'Invalid address').notEmpty();
    req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
    req.checkBody('password', 'Invalid password').notEmpty();
    req.checkBody('method', 'Invalid method').notEmpty();
    req.checkBody('scale', 'Invalid scale').notEmpty();
    req.checkBody('shift', 'Invalid shift').isInt();
    req.checkBody('ssh_port', 'Invalid ssh_port').isInt({min: 1, max: 65535});
    req.checkBody('ssh_user', 'Invalid ssh_user').notEmpty();
    req.checkBody('ssh_password', 'Invalid ssh_password').notEmpty();
    const result = await req.getValidationResult();
    if(!result.isEmpty()) { return Promise.reject(result.array()); }
    const serverId = req.params.serverId;
    const type = req.body.type;
    const isWG = type === 'WireGuard';
    const isTj = type === 'Trojan';
    const name = req.body.name;
    const comment = req.body.comment;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    const shift = isWG ? 0 : req.body.shift;
    const key = isWG ? req.body.key : null;
    const net = isWG ? req.body.net: null;
    const wgPort = isWG ? req.body.wgPort : null;
    const tjPort = isTj ? req.body.tjPort : null;
    const pluginOptions = req.body.pluginOptions;
    const check = +req.body.check;
    const noCheck = +req.body.noCheck;
    const ssh_port = +req.body.ssh_port;
    const ssh_user = req.body.ssh_user;
    const ssh_password = req.body.ssh_password;
    if (!noCheck) {
      await manager.send({
        command: 'flow',
        options: { clear: false, },
      }, {
        host: address,
        port,
        password,
      });
    }
    await serverManager.edit({
      id: serverId,
      type,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift,
      key,
      net,
      wgPort,
      tjPort,
      pluginOptions,
      check,
      ssh_port,
      ssh_user,
      ssh_password,
    });
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteServer = (req, res) => {
  const serverId = req.params.serverId;
  serverManager.del(serverId)
  .then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getTags = async (req, res) => {
  try {
    const type = req.query.type;
    const key = +req.query.key;
    const tags = await webguiTag.getTags(type, key);
    res.send(tags);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.setTags = async (req, res) => {
  try {
    const type = req.body.type;
    const key = +req.body.key;
    const tags = req.body.tags;
    await webguiTag.setTags(type, key, tags);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.executeBatchCommand = async (req, res) => {
  try {
    const commandId = req.body.commandId;
    
    // Fetch command
    const commandObj = await knex('server_command').where({ id: commandId }).first();
    if (!commandObj) return res.status(404).send('Command not found');
    
    // Fetch all servers
    const servers = await knex('server').select();
    
    if (servers.length === 0) {
        return res.send({ output: 'No servers found.' });
    }

    const results = await Promise.all(servers.map(async (server) => {
        const host = server.host.split(':')[0];
        const header = `=== ${server.name} (${host}) ===\n`;
        
        if (!host) return header + 'No host address available.\n';
        // Note: Some servers might use key auth which isn't fully implemented in DB schema for standard servers unless handled in specific ways.
        // Assuming ssh_user and ssh_password are required as per existing logic.
        if (!server.ssh_user || !server.ssh_password) return header + 'No SSH credentials configured.\n';

        return new Promise((resolve) => {
             const conn = new Client();
             let output = '';
             conn.on('ready', () => {
               conn.exec(commandObj.server_command, (err, stream) => {
                 if (err) {
                   conn.end();
                   resolve(header + 'Exec Error: ' + err.message + '\n');
                   return;
                 }
                 stream.on('close', () => {
                   conn.end();
                   resolve(header + output + '\n');
                 }).on('data', (data) => {
                   output += data;
                 }).stderr.on('data', (data) => {
                   output += data;
                 });
               });
             }).on('error', (err) => {
                 resolve(header + 'Connection Failed: ' + err.message + '\n');
             }).connect({
               host: host,
               port: server.ssh_port || 22,
               username: server.ssh_user,
               password: server.ssh_password,
               readyTimeout: 20000,
             });
        });
    }));

    res.send({ output: results.join('\n') });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.executeCommand = async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const commandId = req.body.commandId;
    
    // Fetch server info
    const server = await knex('server').where({ id: serverId }).first();
    if (!server) return res.status(404).send('Server not found');
    
    // Fetch command
    const commandObj = await knex('server_command').where({ id: commandId }).first();
    if (!commandObj) return res.status(404).send('Command not found');
    
    const host = server.host.split(':')[0];
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(commandObj.server_command, (err, stream) => {
        if (err) {
          conn.end();
          return res.status(500).send(err.message);
        }
        let output = '';
        stream.on('close', (code, signal) => {
          conn.end();
          res.send({ output });
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          output += data;
        });
      });
    }).on('error', (err) => {
        console.log(err);
        res.status(500).send('SSH Connection failed: ' + err.message);
    }).connect({
      host: host,
      port: server.ssh_port || 22,
      username: server.ssh_user,
      password: server.ssh_password,
      readyTimeout: 20000,
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};
