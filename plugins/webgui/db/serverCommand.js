const knex = appRequire('init/knex').knex;
const tableName = 'server_command';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if (!exist) {
    await knex.schema.createTable(tableName, function(table) {
      table.increments('id');
      table.string('name');
      table.string('server_command');
      table.string('type').defaultTo('server'); // server or forward
    });
  } else {
    const hasType = await knex.schema.hasColumn(tableName, 'type');
    if (!hasType) {
      await knex.schema.table(tableName, function(table) {
        table.string('type').defaultTo('server');
      });
    }
  }
};

exports.createTable = createTable;
