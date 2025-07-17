namespace UBBGradePortal.Infrastructure.Microsoft;

public interface ILogger<T>
{
    public void LogInformation(string template);
}