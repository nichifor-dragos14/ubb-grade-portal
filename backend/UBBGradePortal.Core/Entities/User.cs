using UBBGradePortal.Domain.Enums;

namespace UBBGradePortal.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The user's course enrollments
    public List<CourseEnrollment> CourseEnrollments { get; set; } = [];

    // The courses the user created
    public List<Course> CreatedCourses { get; set; } = [];

    // The list of activities the student completed
    public List<SolvedActivity> SolvedActivities {  get; set; } = [];
}
