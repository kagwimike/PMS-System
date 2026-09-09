const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const { getPagination, getPagingData } = require('../utils/pagination');

const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, entity_type, entity_id, user_id } = req.query;
    const { limit: size, offset } = getPagination(page, limit);

    const filter = {};
    if (entity_type) filter.entity_type = entity_type;
    if (entity_id) filter.entity_id = entity_id;
    if (user_id) filter.user_id = user_id;

    const data = await AuditLog.findAndCountAll({
      where: filter,
      order: [['created_at', 'DESC']],
      include: ['user'],
      limit: size,
      offset
    });
    const { rows, meta } = getPagingData(data, page, size);
    return successResponse(res, rows, 'Audit logs retrieved successfully', 200, meta);
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return errorResponse(res, 'Failed to retrieve audit logs', 400, error);
  }
};

module.exports = {
  getAuditLogs
};
