const knex = appRequire('init/knex').knex;
const axios = require('axios');

// CloudFlare API配置 - 这些应该在配置文件中设置
const CF_API_TOKEN = process.env.CF_API_TOKEN || 'Y-ccg83lXHXFUlf63EdJiIjgqyhs5rNo3XWejqsZ';
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

// CloudFlare API请求封装
const cfAPI = axios.create({
  baseURL: CF_API_BASE,
  headers: {
    'Authorization': `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 同步到CloudFlare
const syncToCloudFlare = async (record, action = 'update') => {
  try {
    const cfData = {
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl === 1 ? 1 : record.ttl, // CloudFlare uses 1 for auto
      proxied: record.proxy === 1 || record.proxy === true,
      comment: record.comment || ''
    };

    let response;
    switch (action) {
      case 'create':
        response = await cfAPI.post(`/zones/${record.zone_id}/dns_records`, cfData);
        return response.data.result;
      
      case 'update':
        response = await cfAPI.put(`/zones/${record.zone_id}/dns_records/${record.record_id}`, cfData);
        return response.data.result;
      
      case 'delete':
        response = await cfAPI.delete(`/zones/${record.zone_id}/dns_records/${record.record_id}`);
        return response.data.result;
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('CloudFlare API Error:', error.response && error.response.data ? error.response.data : error.message);
    const errorMsg = error.response && error.response.data && error.response.data.errors && error.response.data.errors[0] && error.response.data.errors[0].message 
      ? error.response.data.errors[0].message 
      : error.message;
    throw new Error(`CloudFlare同步失败: ${errorMsg}`);
  }
};

// 获取激活的中转机域名列表
exports.getForwardDomains = async (req, res) => {
  try {
    const forwards = await knex('forward')
      .select('domain', 'ipv4', 'name')
      .where('status', 1)
      .whereNotNull('domain')
      .where('domain', '!=', '');
    
    // 格式化返回数据
    const domains = forwards.map(forward => ({
      domain: forward.domain,
      ipv4: forward.ipv4,
      name: forward.name,
      label: `${forward.domain} (${forward.name})`
    }));
    
    res.send(domains);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getDnsRecords = async (req, res) => {
  try {
    const records = await knex('cf_dns_record').select().orderBy('id', 'desc');
    // 处理bit字段
    records.forEach(record => {
      if (record.proxy && Buffer.isBuffer(record.proxy)) {
        record.proxy = record.proxy[0] === 1;
      } else {
        record.proxy = !!record.proxy;
      }
      if (record.active && Buffer.isBuffer(record.active)) {
        record.active = record.active[0] === 1;
      } else {
        record.active = !!record.active;
      }
    });
    res.send(records);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.getOneDnsRecord = async (req, res) => {
  try {
    const recordId = req.params.recordId;
    const record = await knex('cf_dns_record').select().where({ id: +recordId }).first();
    if (!record) {
      return res.status(404).end();
    }
    // 处理bit字段
    if (record.proxy && Buffer.isBuffer(record.proxy)) {
      record.proxy = record.proxy[0] === 1;
    } else {
      record.proxy = !!record.proxy;
    }
    if (record.active && Buffer.isBuffer(record.active)) {
      record.active = record.active[0] === 1;
    } else {
      record.active = !!record.active;
    }
    console.log('Returning DNS record:', record);
    res.send(record);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.addDnsRecord = async (req, res) => {
  try {
    req.checkBody('record_id', 'Invalid record_id').notEmpty();
    req.checkBody('zone_id', 'Invalid zone_id').notEmpty();
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('content', 'Invalid content').notEmpty();
    req.checkBody('type', 'Invalid type').notEmpty();
    req.checkBody('ttl', 'Invalid ttl').isInt({ min: 1 });
    
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const {
      record_id,
      zone_id,
      name,
      content,
      comment,
      type,
      ttl,
      proxy,
      active
    } = req.body;

    const insertData = {
      record_id,
      zone_id,
      name,
      content,
      comment: comment || null,
      type,
      ttl: +ttl,
      proxy: proxy === true || proxy === 1 || proxy === '1' ? 1 : 0,
      active: active === true || active === 1 || active === '1' ? 1 : 0
    };

    console.log('Adding DNS record:', insertData);

    // 如果记录激活，同步到CloudFlare
    if (insertData.active) {
      try {
        const cfResult = await syncToCloudFlare(insertData, 'create');
        console.log('CloudFlare sync success:', cfResult);
      } catch (error) {
        console.error('CloudFlare sync failed:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    const [id] = await knex('cf_dns_record').insert(insertData);
    res.send({ id });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.editDnsRecord = async (req, res) => {
  try {
    const recordId = req.params.recordId;
    req.checkBody('record_id', 'Invalid record_id').notEmpty();
    req.checkBody('zone_id', 'Invalid zone_id').notEmpty();
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('content', 'Invalid content').notEmpty();
    req.checkBody('type', 'Invalid type').notEmpty();
    req.checkBody('ttl', 'Invalid ttl').isInt({ min: 1 });
    
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const {
      record_id,
      zone_id,
      name,
      content,
      comment,
      type,
      ttl,
      proxy,
      active
    } = req.body;

    console.log('Updating DNS record with data:', req.body);

    const updateData = {
      record_id,
      zone_id,
      name,
      content,
      comment: comment || null,
      type,
      ttl: +ttl,
      proxy: proxy === true || proxy === 1 || proxy === '1' ? 1 : 0,
      active: active === true || active === 1 || active === '1' ? 1 : 0
    };

    console.log('Update data:', updateData);

    // 如果记录激活，同步到CloudFlare
    if (updateData.active) {
      try {
        const cfResult = await syncToCloudFlare(updateData, 'update');
        console.log('CloudFlare sync success:', cfResult);
      } catch (error) {
        console.error('CloudFlare sync failed:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    await knex('cf_dns_record').where({ id: +recordId }).update(updateData);
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.deleteDnsRecord = async (req, res) => {
  try {
    const recordId = req.params.recordId;
    
    // 获取记录信息用于CloudFlare删除
    const record = await knex('cf_dns_record').select().where({ id: +recordId }).first();
    if (!record) {
      return res.status(404).end();
    }

    // 如果记录在CloudFlare中存在，先删除
    if (record.active) {
      try {
        await syncToCloudFlare(record, 'delete');
        console.log('CloudFlare record deleted');
      } catch (error) {
        console.error('CloudFlare delete failed:', error);
        // 即使CloudFlare删除失败，也继续删除本地记录
      }
    }

    await knex('cf_dns_record').where({ id: +recordId }).del();
    res.send('success');
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

// 从CloudFlare同步记录到本地数据库
exports.syncFromCloudFlare = async (req, res) => {
  try {
    const { zone_id } = req.body;
    if (!zone_id) {
      return res.status(400).json({ error: 'zone_id is required' });
    }

    // 获取CloudFlare记录
    const response = await cfAPI.get(`/zones/${zone_id}/dns_records`);
    const cfRecords = response.data.result;

    let syncCount = 0;
    for (const cfRecord of cfRecords) {
      // 检查本地是否已存在该记录
      const existingRecord = await knex('cf_dns_record')
        .where({ record_id: cfRecord.id })
        .first();

      const recordData = {
        record_id: cfRecord.id,
        zone_id: cfRecord.zone_id,
        name: cfRecord.name,
        content: cfRecord.content,
        comment: cfRecord.comment || null,
        type: cfRecord.type,
        ttl: cfRecord.ttl,
        proxy: cfRecord.proxied ? 1 : 0,
        active: 1 // 从CloudFlare同步的记录默认为激活状态
      };

      if (existingRecord) {
        // 更新现有记录
        await knex('cf_dns_record')
          .where({ record_id: cfRecord.id })
          .update(recordData);
      } else {
        // 插入新记录
        await knex('cf_dns_record').insert(recordData);
      }
      syncCount++;
    }

    res.send({ message: `Successfully synced ${syncCount} records from CloudFlare` });
  } catch (error) {
    console.error('Sync from CloudFlare failed:', error);
    const errorMsg = error.response && error.response.data && error.response.data.errors && error.response.data.errors[0] && error.response.data.errors[0].message 
      ? error.response.data.errors[0].message 
      : error.message;
    res.status(500).json({ error: errorMsg });
  }
};