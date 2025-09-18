using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ICourseEnrollmentRepository _courseEnrollmentRepository;

    public UserService(
        IUserRepository userRepository,
        ICourseEnrollmentRepository courseEnrollmentRepository
    )
    {
        _userRepository = userRepository;
        _courseEnrollmentRepository = courseEnrollmentRepository;
    }

    public async Task Add(User user, CancellationToken cancellationToken)
    {
        await _userRepository.Add(user, cancellationToken);
    }

    public async Task EnrollToCourses(Guid userId, List<Guid> courseIds, CancellationToken cancellationToken)
    {
        if(courseIds.Count == 0)
        {
            return;
        }

        courseIds = courseIds
            .Distinct()
            .ToList();

        var enrollments = courseIds
            .Select(courseId => new CourseEnrollment
            {
                UserId = userId,
                CourseId = courseId
            })
            .ToList();

        await _courseEnrollmentRepository.Add(enrollments, cancellationToken);
    }

    public async Task<User?> GetById(Guid userId, CancellationToken cancellationToken)
    {
        return await _userRepository.GetById(userId, cancellationToken);
    }
}
