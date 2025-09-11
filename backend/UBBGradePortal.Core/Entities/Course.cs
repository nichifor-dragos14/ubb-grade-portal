namespace UBBGradePortal.Domain.Entities;

public class Course
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The activities of the course
    public List<Activity> Activities { get; set; } = [];

    // The enrollments for the course
    public List<CourseEnrollment> CourseEnrollments { get; set; } = []; 

    // The user that created the course
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; }

    // The domain of the course
    public Guid CourseDomainId { get; set; }
    public CourseDomain CourseDomain { get; set; }
}