namespace UBBGradePortal.Application.DTOs.Course;

public record AddCourseDto(
    string Name,
    string Description,
    bool AssistedLlmEvaluation,
    Guid CourseDomainId
);
