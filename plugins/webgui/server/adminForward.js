const knex = appRequire('init/knex').knex;

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