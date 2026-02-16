namespace UBBGradePortal.Application.DTOs.Leaderboard;

public class StudentLeaderboardEntryDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SubmissionsCount { get; set; }
    public int Position { get; set; }
}
