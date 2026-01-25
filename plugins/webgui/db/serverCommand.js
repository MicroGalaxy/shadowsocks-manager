const knex = appRequire('init/knex').knex;
const tableName = 'server_command';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if (!exist) {
    await knex.schema.createTable(tableName, function(table) {
      table.increments('id');
      table.string('name');
      table.string('server_command');
    });
  }
};

exports.createTable = createTable;
