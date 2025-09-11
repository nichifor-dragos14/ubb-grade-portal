namespace UBBGradePortal.Domain.Entities;

public class CourseEnrollment
{
    public Guid Id { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The user that enrolled the course
    public Guid UserId { get; set; }
    public User User { get; set; }

    // The course that the user enrolled to
    public Guid CourseId { get; set; }
    public Course Course { get; set; }
}
