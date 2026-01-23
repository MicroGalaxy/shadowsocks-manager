const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');

const getFlowPack = async (accountId, start, end) => {
  // 流量包有效期延长：当前周期 + 下一个周期
  // 计算周期长度
  const cycleLength = end - start;
  // 向前追溯一个周期的时间
  const searchStart = start - cycleLength;
  
  const flowPacks = await knex('webgui_flow_pack')
    .where({ accountId })
    .whereBetween('createTime', [ searchStart, end ]);
    
  if(!flowPacks.length) { return 0; }
  return flowPacks.reduce((a, b) => {
    return { flow: a.flow + b.flow };
  }, { flow: 0 }).flow;
};

exports.getFlowPack = getFlowPack;
