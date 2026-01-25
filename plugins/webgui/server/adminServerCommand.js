const knex = appRequire('init/knex').knex;

exports.getServerCommands = async (req, res) => {
  try {
    const commands = await knex('server_command').select().orderBy('id', 'desc');
    res.send(commands);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getOneServerCommand = async (req, res) => {
  try {
    const id = req.params.id;
    const command = await knex('server_command').select().where({ id }).first();
    if (!command) {
      return res.status(404).end();
    }
    res.send(command);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.addServerCommand = async (req, res) => {
  try {
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('server_command', 'Invalid server_command').notEmpty();
    
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { name, server_command } = req.body;
    const [id] = await knex('server_command').insert({ name, server_command });
    res.send({ id });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.editServerCommand = async (req, res) => {
  try {
    const id = req.params.id;
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('server_command', 'Invalid server_command').notEmpty();
    
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { name, server_command } = req.body;
    await knex('server_command').where({ id }).update({ name, server_command });
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.deleteServerCommand = async (req, res) => {
  try {
    const id = req.params.id;
    await knex('server_command').where({ id }).del();
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};
