using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseEnrollmentRepository
{
    Task<bool> Add(List<CourseEnrollment> courseEnrollments, CancellationToken cancellationToken);
}
