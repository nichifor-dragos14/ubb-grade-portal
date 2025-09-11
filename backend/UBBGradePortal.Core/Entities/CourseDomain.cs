namespace UBBGradePortal.Domain.Entities;

public class CourseDomain
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The courses that have this domain
    public List<Course> Courses { get; set; } = [];
}
