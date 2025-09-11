namespace UBBGradePortal.Domain.Entities;

public class Activity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The course the activity is linked to
    public Guid CourseId { get; set; }
    public Course Course { get; set; }

    // The solvings of the activity
    public List<SolvedActivity> SolvedActivities { get; set; }
}
