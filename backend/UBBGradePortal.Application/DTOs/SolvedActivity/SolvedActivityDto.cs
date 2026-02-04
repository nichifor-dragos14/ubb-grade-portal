using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.SolvedActivity;

public class SolvedActivityDto
{
    public Guid Id { get; set; }
    public SolvedActivityStatus? Status { get; set; }
    public int? Grade { get; set; }
    public string? ProfessorComment { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public string? SolvedByName { get; set; }
    public string? CourseName { get; set; }
    public ActivityDto? Activity { get; set; } = null;
    public List<DocumentDto>? Documents { get; set; } = [];
}
