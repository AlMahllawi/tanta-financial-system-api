import { PaginationDto, PaginatedDto } from '../dto/pagination.dto.js';

export const createPaginator = (
  paginationDto: PaginationDto,
  defaultOptions: { page: number; perPage: number } = { page: 1, perPage: 10 },
) => {
  const page = paginationDto.page || defaultOptions.page;
  const perPage = paginationDto.perPage || defaultOptions.perPage;

  const skip = (page - 1) * perPage;
  const take = perPage;

  return { skip, take, page, perPage };
};

export const createPaginatedResult = <T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedDto<T> => {
  const lastPage = Math.ceil(total / perPage);
  const next = page < lastPage ? page + 1 : null;
  const prev = page > 1 ? page - 1 : null;

  return {
    data,
    meta: {
      total,
      lastPage,
      currentPage: page,
      perPage,
      prev,
      next,
    },
  };
};
