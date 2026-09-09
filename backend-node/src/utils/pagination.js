const getPagination = (page, size) => {
  const limit = size ? Math.min(parseInt(size), 100) : 10;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows } = data;
  const currentPage = page ? parseInt(page) : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    totalItems,
    rows,
    meta: {
      totalItems,
      totalPages,
      currentPage,
      limit,
    }
  };
};

module.exports = {
  getPagination,
  getPagingData
};
