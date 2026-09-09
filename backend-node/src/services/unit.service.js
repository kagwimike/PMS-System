const Unit = require('../models/Unit');

const getUnits = async (propertyId, limit, offset) => {
  const whereClause = propertyId ? { property_id: propertyId } : {};
  return Unit.findAndCountAll({ where: whereClause, limit, offset });
};

const createUnit = async (unitBody) => {
  return Unit.create(unitBody);
};

const updateUnit = async (id, updateBody) => {
  const unit = await Unit.findByPk(id);
  if (!unit) throw new Error('Unit not found');
  Object.assign(unit, updateBody);
  await unit.save();
  return unit;
};

const deleteUnit = async (id) => {
  const unit = await Unit.findByPk(id);
  if (!unit) throw new Error('Unit not found');

  const Lease = require('../models/Lease');
  const activeLeases = await Lease.count({
    where: { unit_id: id, status: 'ACTIVE' }
  });

  if (activeLeases > 0) {
    throw new Error('Cannot delete unit while an active lease exists');
  }

  await unit.destroy();
  return unit;
};

module.exports = {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
};
