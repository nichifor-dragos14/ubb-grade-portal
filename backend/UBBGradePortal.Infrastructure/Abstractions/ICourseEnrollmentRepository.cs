using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseEnrollmentRepository
{
    Task<List<CourseEnrollment>> GetAllByUserId(Guid loggedUserId, CancellationToken cancellationToken);
    Task<bool> Add(List<CourseEnrollment> courseEnrollments, CancellationToken cancellationToken);
}
