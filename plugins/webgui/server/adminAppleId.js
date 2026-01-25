const knex = appRequire('init/knex').knex;

// 处理bit字段
const processBitField = (value) => {
  if (value && Buffer.isBuffer(value)) {
    return value[0] === 1;
  }
  return !!value;
};

// 处理记录中的所有bit字段
const processRecord = (record) => {
  if (!record) return record;
  record.status = processBitField(record.status);
  record.using = processBitField(record.using);
  record.shadowrocket = processBitField(record.shadowrocket);
  record.icloud_photo_status = processBitField(record.icloud_photo_status);
  return record;
};

// 获取所有Apple ID记录
exports.getAppleIds = async (req, res) => {
  try {
    const records = await knex('apple_id').select().orderBy('id', 'desc');
    records.forEach(processRecord);
    res.send(records);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

// 获取单个Apple ID记录
exports.getOneAppleId = async (req, res) => {
  try {
    const recordId = req.params.recordId;
    const record = await knex('apple_id').select().where({ id: +recordId }).first();
    if (!record) {
      return res.status(404).end();
    }
    processRecord(record);
    res.send(record);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

// 添加Apple ID记录
exports.addAppleId = async (req, res) => {
  try {
    req.checkBody('apple_id', 'Invalid apple_id').notEmpty();
    req.checkBody('password', 'Invalid password').notEmpty();
    
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const {
      apple_id,
      password,
      question_friend,
      question_work,
      question_parent,
      birthday,
      status,
      using,
      shadowrocket,
      icloud_photo_status
    } = req.body;

    const insertData = {
      apple_id,
      password,
      question_friend: question_friend || null,
      question_work: question_work || null,
      question_parent: question_parent || null,
      birthday: birthday || null,
      status: status === true || status === 1 || status === '1' ? 1 : 0,
      using: using === true || using === 1 || using === '1' ? 1 : 0,
      shadowrocket: shadowrocket === true || shadowrocket === 1 || shadowrocket === '1' ? 1 : 0,
      icloud_photo_status: icloud_photo_status === true || icloud_photo_status === 1 || icloud_photo_status === '1' ? 1 : 0
    };

    const [id] = await knex('apple_id').insert(insertData);
    res.send({ id });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

// 编辑Apple ID记录
exports.editAppleId = async (req, res) => {
  try {
    const recordId = req.params.recordId;
    req.checkBody('apple_id', 'Invalid apple_id').notEmpty();
    req.checkBody('password', 'Invalid password').notEmpty();
    
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const {
      apple_id,
      password,
      question_friend,
      question_work,
      question_parent,
      birthday,
      status,
      using,
      shadowrocket,
      icloud_photo_status
    } = req.body;

    const updateData = {
      apple_id,
      password,
      question_friend: question_friend || null,
      question_work: question_work || null,
      question_parent: question_parent || null,
      birthday: birthday || null,
      status: status === true || status === 1 || status === '1' ? 1 : 0,
      using: using === true || using === 1 || using === '1' ? 1 : 0,
      shadowrocket: shadowrocket === true || shadowrocket === 1 || shadowrocket === '1' ? 1 : 0,
      icloud_photo_status: icloud_photo_status === true || icloud_photo_status === 1 || icloud_photo_status === '1' ? 1 : 0
    };

    await knex('apple_id').where({ id: +recordId }).update(updateData);
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

// 删除Apple ID记录
exports.deleteAppleId = async (req, res) => {
  try {
    const recordId = req.params.recordId;
    await knex('apple_id').where({ id: +recordId }).del();
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};
