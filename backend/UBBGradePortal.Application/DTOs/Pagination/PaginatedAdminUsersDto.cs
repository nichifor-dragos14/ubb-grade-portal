using UBBGradePortal.Application.DTOs.Admin;

namespace UBBGradePortal.Application.DTOs.Pagination;

public record PaginatedAdminUsersDto(
    int Count,
    List<AdminUserDto> Users
);
