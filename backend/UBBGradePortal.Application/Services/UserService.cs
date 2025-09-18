using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ICourseEnrollmentRepository _courseEnrollmentRepository;

    public UserService(IUserRepository userRepository, ICourseEnrollmentRepository courseEnrollmentRepository)
    {
        _userRepository = userRepository;
        _courseEnrollmentRepository = courseEnrollmentRepository;
    }

    public async Task Add(User user)
    {
        await _userRepository.Add(user);
    }

    public async Task EnrollToCourses(Guid userId, List<Guid> courseIds)
    {
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
        await _courseEnrollmentRepository.Add(enrollments);
    }

    public async Task<User?> GetById(Guid userId)
    {
        return await _userRepository.GetById(userId);
    }
}
