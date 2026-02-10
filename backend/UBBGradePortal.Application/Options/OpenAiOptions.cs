namespace UBBGradePortal.Application.Options;

public sealed class OpenAiOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string Model { get; init; } = "gpt-4o-mini";
    public double Temperature { get; init; } = 0.2;
    public int MaxTokens { get; init; } = 400;
    public int MaxInputChars { get; init; } = 20000;
    public int MaxDocChars { get; init; } = 6000;
    public int MaxDocs { get; init; } = 10;
    public int MaxZipBytes { get; init; } = 2000000;
    public int RequestTimeoutSeconds { get; init; } = 60;
}
