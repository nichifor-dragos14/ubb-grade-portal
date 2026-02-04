using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.Activity;

public class ActivityDto
{
    public Guid Id { get; set; }
    public string? Name {  get; set; }
    public string? Description { get; set; }
    public DateTime? CreatedOn { get; set; }
    public SolvedActivityStatus? SolvedActivityStatus { get; set; }
    public int? NumberOfDocuments { get; set; }
    public List<DocumentDto>? Documents { get; set; } = [];
    public List<SolvedActivityDto>? SolvedActivities { get; set; } = [];
};