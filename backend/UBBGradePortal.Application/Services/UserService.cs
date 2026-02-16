using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Admin;
using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.DTOs.User;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Domain.Enums;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ICourseEnrollmentRepository _courseEnrollmentRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        ICourseEnrollmentRepository courseEnrollmentRepository,
        ICourseRepository courseRepository,
        ILogger<UserService> logger
    )
    {
        _userRepository = userRepository;
        _courseEnrollmentRepository = courseEnrollmentRepository;
        _courseRepository = courseRepository;
        _logger = logger;
    }

    public async Task<Guid> Add(AddUserDto addUserDto, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Id = addUserDto.Id,
            FirstName = addUserDto.FirstName,
            LastName = addUserDto.LastName,
            Email = addUserDto.Email,
            Role = addUserDto.Role,
            IsBanned = false,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow,
        };

        return await _userRepository.Add(user, cancellationToken);
    }

    public async Task<bool> EnrollToCourses(Guid userId, List<Guid> courseIds, CancellationToken cancellationToken)
    {
        var courses = await _courseRepository.GetAll(cancellationToken);

        courseIds = courseIds
            .Distinct()
            .Where(courseId => courses.Any(c => c.Id == courseId))
            .ToList();

        if (courseIds.Count == 0)
        {
            _logger.LogInformation("No courses were available for enrollment");

            return false;
        }

        var enrollments = courseIds
            .Select(courseId => new CourseEnrollment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CourseId = courseId,
                CreatedOn = DateTime.UtcNow,
                UpdatedOn = DateTime.UtcNow,
            })
            .ToList();

        return await _courseEnrollmentRepository.Add(enrollments, cancellationToken);
    }

    public async Task<User?> GetById(Guid userId, CancellationToken cancellationToken)
    {
        return await _userRepository.GetById(userId, cancellationToken);
    }

    public async Task<PaginatedAdminUsersDto> GetAll(int pageNumber, int pageSize, Role? role, string? searchQuery, CancellationToken cancellationToken)
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 5 : pageSize;

        var (count, users) = await _userRepository.GetAll(pageNumber, pageSize, role, searchQuery, cancellationToken);

        var result = users
            .Select(user => new AdminUserDto(
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role.ToString(),
                user.IsBanned))
            .ToList();

        return new PaginatedAdminUsersDto(count, result);
    }

    public async Task<bool> SetBanned(Guid userId, bool isBanned, CancellationToken cancellationToken)
    {
        return await _userRepository.SetBanned(userId, isBanned, cancellationToken);
    }
}
