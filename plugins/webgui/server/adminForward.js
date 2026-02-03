const knex = appRequire('init/knex').knex;
const Client = require('ssh2').Client;

exports.getForwards = async (req, res) => {
  try {
    const forwards = await knex('forward').select().orderBy('id', 'desc');
    // 处理status字段，确保正确显示
    forwards.forEach(forward => {
      if (forward.status && Buffer.isBuffer(forward.status)) {
        forward.status = forward.status[0] === 1;
      } else {
        forward.status = !!forward.status;
      }
    });
    res.send(forwards);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getOneForward = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const forward = await knex('forward').select().where({ id: +forwardId }).first();
    if (!forward) {
      return res.status(404).end();
    }
    // 确保status字段返回为boolean或数字
    if (forward.status && Buffer.isBuffer(forward.status)) {
      forward.status = forward.status[0] === 1;
    } else {
      forward.status = !!forward.status;
    }
    console.log('Returning forward:', forward);
    res.send(forward);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.addForward = async (req, res) => {
  try {
    req.checkBody('name', 'Invalid name').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const {
      name,
      ipv4,
      ipv6,
      domain,
      ssh_user,
      ssh_password,
      ssh_port,
      nginx_name,
      nginx_path,
      control_port,
      status
    } = req.body;

    const insertData = {
      name,
      ipv4: ipv4 || null,
      ipv6: ipv6 || null,
      domain: domain || null,
      ssh_user: ssh_user || null,
      ssh_password: ssh_password || null,
      ssh_port: ssh_port ? +ssh_port : null,
      nginx_name: nginx_name || null,
      nginx_path: nginx_path || null,
      control_port: control_port ? +control_port : null,
      status: status === true || status === 1 || status === '1' ? 1 : 0
    };

    const [id] = await knex('forward').insert(insertData);
    res.send({ id });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.editForward = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    req.checkBody('name', 'Invalid name').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const {
      name,
      ipv4,
      ipv6,
      domain,
      ssh_user,
      ssh_password,
      ssh_port,
      nginx_name,
      nginx_path,
      control_port,
      status
    } = req.body;

    console.log('Updating forward with data:', req.body);
    console.log('Status value:', status, 'Type:', typeof status);

    const updateData = {
      name,
      ipv4: ipv4 || null,
      ipv6: ipv6 || null,
      domain: domain || null,
      ssh_user: ssh_user || null,
      ssh_password: ssh_password || null,
      ssh_port: ssh_port ? +ssh_port : null,
      nginx_name: nginx_name || null,
      nginx_path: nginx_path || null,
      control_port: control_port ? +control_port : null,
      status: status === true || status === 1 || status === '1' ? 1 : 0
    };

    console.log('Update data:', updateData);

    await knex('forward').where({ id: +forwardId }).update(updateData);
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.deleteForward = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    await knex('forward').where({ id: +forwardId }).del();
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.executeCommand = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const commandId = req.body.commandId;
    
    // Fetch forward info
    const forward = await knex('forward').where({ id: forwardId }).first();
    if (!forward) return res.status(404).send('Forward not found');
    
    // Fetch command
    const commandObj = await knex('server_command').where({ id: commandId }).first();
    if (!commandObj) return res.status(404).send('Command not found');
    
    const host = forward.domain || forward.ipv4;
    if (!host) return res.status(400).send('No host address available (domain or ipv4)');

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
      port: forward.ssh_port || 22,
      username: forward.ssh_user,
      password: forward.ssh_password,
      readyTimeout: 20000,
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getForwardPorts = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const page = +req.query.page || 1;
    const pageSize = +req.query.pageSize || 10;
    const searchPort = req.query.searchPort;
    const searchAddress = req.query.searchAddress;
    const searchServerId = req.query.searchServerId;

    const query = knex('forwardport').where({ forwardId: +forwardId });

    if (searchPort) {
      query.where('port', 'like', `%${searchPort}%`);
    }

    if (searchServerId) {
        // If searching by server, we need to find all IPs for that server
        const server = await knex('server').where({ id: +searchServerId }).first();
        if (server && server.comment) {
            try {
                const comment = JSON.parse(server.comment);
                const ips = [...(comment.ipv4 || []), ...(comment.ipv6 || [])];
                if (ips.length > 0) {
                   query.whereIn('host', ips);
                } else {
                   // Server has no IPs, return empty
                   query.whereRaw('1 = 0');
                }
            } catch (e) {
                 query.whereRaw('1 = 0');
            }
        } else {
             query.whereRaw('1 = 0');
        }
    } else if (searchAddress) {
      query.where('host', 'like', `%${searchAddress}%`);
    }

    const totalRes = await query.clone().count('* as count').first();
    const total = totalRes.count;

    const ports = await query.orderBy('port', 'asc')
      .offset((page - 1) * pageSize)
      .limit(pageSize);

    res.send({
      total,
      data: ports
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.addForwardPort = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const { port, host } = req.body;
    
    // Check if port exists for this forwardId
    const exist = await knex('forwardport').where({ forwardId: +forwardId, port: +port }).first();
    if (exist) {
        return res.status(400).send('Port already exists');
    }

    await knex('forwardport').insert({
      forwardId: +forwardId,
      port: +port,
      host,
    });
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.editForwardPort = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const port = req.params.port;
    const { host } = req.body;

    await knex('forwardport').where({ forwardId: +forwardId, port: +port }).update({
      host
    });
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.deleteForwardPort = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const port = req.params.port;

    await knex('forwardport').where({ forwardId: +forwardId, port: +port }).del();
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.batchEditForwardPort = async (req, res) => {
  try {
    const forwardId = req.params.forwardId;
    const { sourceHost, targetHost } = req.body;

    if (!sourceHost || !targetHost) {
        return res.status(400).send('Source and target hosts are required');
    }

    await knex('forwardport')
      .where({ forwardId: +forwardId, host: sourceHost })
      .update({ host: targetHost });
      
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getForwardTargetServers = async (req, res) => {
    try {
        const port = req.query.port;
        
        let serverIds = null;
        
        // 1. If port is provided, check account_plugin
        if (port) {
            const plugin = await knex('account_plugin').where({ port: +port }).first();
            if (plugin && plugin.server) {
                try {
                    const ids = JSON.parse(plugin.server);
                    if (Array.isArray(ids) && ids.length > 0) {
                        serverIds = ids;
                    }
                } catch (e) {
                    // ignore error
                }
            }
        }

        // 2. Fetch servers
        const query = knex('server').select('id', 'name', 'comment').orderBy('name', 'asc');
        
        // Only filter by ID if we found specific servers for the port
        if (serverIds) {
            query.whereIn('id', serverIds);
        }
        
        const servers = await query;

        // 3. Filter and process servers based on ipMode and available IPs
        const validServers = servers.map(s => {
            try {
                const comment = JSON.parse(s.comment);
                let ipv4 = comment.ipv4 || [];
                let ipv6 = comment.ipv6 || [];
                const ipMode = comment.ipMode; // May be undefined, meaning default behavior

                // Filter based on ipMode
                if (ipMode === 4) { // IPV4Only
                    ipv6 = [];
                } else if (ipMode === 6) { // IPV6Only
                    ipv4 = [];
                }
                // IPV4Prefer(14), IPV6Prefer(16), Unknown(999) or others -> keep both

                if (ipv4.length === 0 && ipv6.length === 0) {
                    return null;
                }

                return {
                    id: s.id,
                    name: s.name,
                    ipv4: ipv4,
                    ipv6: ipv6,
                    ipMode: ipMode
                };
            } catch (e) {
                return null;
            }
        }).filter(s => s !== null);

        res.send(validServers);
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
