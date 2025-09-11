namespace UBBGradePortal.Domain.Entities;

public class SolvedActivity
{
    public Guid Id { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The activity that the user solved
    public Guid ActivityId { get; set; }
    public Activity Activity { get; set; }

    // The user that solved the activity
    public Guid UserId { get; set; }
    public User User { get; set; }
}
