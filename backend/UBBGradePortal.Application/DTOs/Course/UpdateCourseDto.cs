namespace UBBGradePortal.Application.DTOs.Course;

public record UpdateCourseDto(
    string Description,
    bool AssistedLlmEvaluation
);
