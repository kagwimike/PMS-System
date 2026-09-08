const Unit = require('../models/Unit');

const getUnits = async (propertyId) => {
  const filter = {};
  if (propertyId) {
    filter.property_id = propertyId;
  }
  return Unit.findAll({ where: filter });
};

const createUnit = async (unitBody) => {
  return Unit.create(unitBody);
};

module.exports = {
  getUnits,
  createUnit,
};
