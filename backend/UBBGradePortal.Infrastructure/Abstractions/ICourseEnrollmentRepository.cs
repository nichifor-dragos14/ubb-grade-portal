using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseEnrollmentRepository
{
    Task<List<CourseEnrollment>> GetAllByUserId(Guid loggedUserId, CancellationToken cancellationToken);
    Task<CourseEnrollment?> GetByCourseIdAndUserId(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken);
    Task<bool> Add(List<CourseEnrollment> courseEnrollments, CancellationToken cancellationToken);
    Task<bool> Delete(CourseEnrollment courseEnrollment, CancellationToken cancellationToken);
}
