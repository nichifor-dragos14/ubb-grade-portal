namespace UBBGradePortal.Domain.Entities;

public class SolvedActivity
{
    public Guid Id { get; set; }
    public SolvedActivityStatus Status { get; set; }
    public double Grade { get; set; }
    public string? ProfessorComment { get; set; }
    public string? AiDetectedSummary { get; set; }
    public string? AiDetectedGoodPoints { get; set; }
    public string? AiDetectedBadPoints { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // The activity that the user solved
    public Guid ActivityId { get; set; }
    public Activity Activity { get; set; }

    // The user that solved the activity
    public Guid UserId { get; set; }
    public User User { get; set; }

    // The documents linked to the submission
    public List<SolvedActivityDocument> SolvedActivityDocuments { get; set; } = [];
}
