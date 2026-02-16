namespace UBBGradePortal.Application.DTOs.Leaderboard;

public class BadgeDto
{
    public Guid UserId { get; set; }
    public DateTime CreatedOn { get; set; }
    public int Month { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Position { get; set; }
}
