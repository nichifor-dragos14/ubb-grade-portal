namespace UBBGradePortal.Infrastructure.Microsoft;

internal class MicrosoftLogger<T>(ILogger<T> logger) : ILogger<T>
{
    public void LogInformation(string template)
    {
        logger.LogInformation(template);
    }
}