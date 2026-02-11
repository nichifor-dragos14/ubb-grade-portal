using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UglyToad.PdfPig;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Ai;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Application.Options;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Services;

public class OpenAiService : IOpenAiService
{
    private static readonly string[] TextExtensions =
    [
        ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml",
        ".ts", ".tsx", ".js", ".jsx", ".html", ".css",
        ".cs", ".java", ".py", ".cpp", ".c", ".h", ".hpp", ".sql"
    ];

    private static readonly string[] TextContentTypes =
    [
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/json",
        "application/xml",
        "text/xml",
        "application/yaml",
        "text/yaml"
    ];

    private readonly ISolvedActivityRepository _solvedActivityRepository;
    private readonly IUploadPresignService _uploadPresignService;
    private readonly OpenAiOptions _openAiOptions;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OpenAiService> _logger;

    public OpenAiService(
        ISolvedActivityRepository solvedActivityRepository,
        IUploadPresignService uploadPresignService,
        IOptions<OpenAiOptions> openAiOptions,
        IHttpClientFactory httpClientFactory,
        ILogger<OpenAiService> logger)
    {
        _solvedActivityRepository = solvedActivityRepository;
        _uploadPresignService = uploadPresignService;
        _openAiOptions = openAiOptions.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<OpenAiSolvedActivityFeedback> GenerateSolvedActivitySummary(Guid solvedActivityId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivity = await _solvedActivityRepository.GetById(solvedActivityId, cancellationToken);

        if (solvedActivity == null)
        {
            _logger.LogInformation("Solved activity {SolvedActivityId} not found", solvedActivityId);
            throw new NotFoundException("The solved activity does not exist");
        }

        if (solvedActivity.User.Id != loggedUserId)
        {
            _logger.LogInformation("User {UserId} cannot request AI summary for {SolvedActivityId}", loggedUserId, solvedActivityId);
            throw new ForbiddenException("You cannot request this summary");
        }

        if (string.IsNullOrWhiteSpace(_openAiOptions.ApiKey))
        {
            throw new InvalidOperationException("OpenAI API key is not configured");
        }

        var activityDescription = solvedActivity.Activity.Description ?? string.Empty;
        var activityDocuments = solvedActivity.Activity.ActivityDocuments;
        var solvedDocuments = solvedActivity.SolvedActivityDocuments;

        var (activityText, activityDocCount) = await ExtractDocumentsText(activityDocuments, cancellationToken);
        var (solvedText, solvedDocCount) = await ExtractDocumentsText(solvedDocuments, cancellationToken);

        if (solvedDocCount == 0)
        {
            _logger.LogInformation("No submission documents could be processed for solved activity {SolvedActivityId}", solvedActivityId);
            return new OpenAiSolvedActivityFeedback();
        }

        var prompt = BuildPrompt(activityDescription, activityText, solvedText, activityDocCount, solvedDocCount);

        var request = new
        {
            model = _openAiOptions.Model,
            temperature = _openAiOptions.Temperature,
            max_tokens = _openAiOptions.MaxTokens,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You are a teaching assistant. Use only the provided text. Do not mention screenshots, images, videos, or other media. If the submission text is not related to the assessment, set goodPoints to an empty string and state the irrelevance in badPoints. Return valid JSON only."
                },
                new
                {
                    role = "user",
                    content = prompt
                }
            }
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiOptions.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(Math.Max(10, _openAiOptions.RequestTimeoutSeconds));

        var payload = JsonSerializer.Serialize(request);
        using var content = new StringContent(payload, Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("OpenAI request failed: {Status} {Body}", response.StatusCode, responseBody);
            throw new InvalidOperationException("AI summary request failed");
        }

        return ParseResponse(responseBody);
    }

    public async Task<OpenAiCourseRecommendationResult> RecommendCourseSelections(string phrase, List<CourseDomain> courseDomains, List<Course> courses, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(phrase))
        {
            return new OpenAiCourseRecommendationResult();
        }

        if (string.IsNullOrWhiteSpace(_openAiOptions.ApiKey))
        {
            throw new InvalidOperationException("OpenAI API key is not configured");
        }

        var payload = new
        {
            phrase = phrase.Trim(),
            courseDomains = courseDomains
                .Select(cd => new
                {
                    domainId = cd.Id,
                    domainName = cd.Name,
                    courses = courses
                        .Where(c => c.CourseDomainId == cd.Id)
                        .Select(c => new { courseId = c.Id, courseName = c.Name })
                        .ToList()
                })
                .ToList()
        };

        var prompt = new StringBuilder()
            .AppendLine("Task: pick the most relevant course domains and courses for the user's interests.")
            .AppendLine("Return JSON with keys: courseDomainIds (array of GUIDs), courseIds (array of GUIDs).")
            .AppendLine("Use only the provided IDs. Do not invent new IDs.")
            .AppendLine()
            .AppendLine("Input:")
            .AppendLine(JsonSerializer.Serialize(payload))
            .ToString();

        var request = new
        {
            model = _openAiOptions.Model,
            temperature = _openAiOptions.Temperature,
            max_tokens = _openAiOptions.MaxTokens,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = "You are a helpful academic advisor. Return valid JSON only." },
                new { role = "user", content = prompt }
            }
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiOptions.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(Math.Max(10, _openAiOptions.RequestTimeoutSeconds));

        var requestBody = JsonSerializer.Serialize(request);
        using var content = new StringContent(requestBody, Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("OpenAI recommendation request failed: {Status} {Body}", response.StatusCode, responseBody);
            throw new InvalidOperationException("AI recommendation request failed");
        }

        return ParseRecommendationResponse(responseBody);
    }

    private OpenAiCourseRecommendationResult ParseRecommendationResponse(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            var content = root
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
            {
                return new OpenAiCourseRecommendationResult();
            }

            var json = NormalizeJsonContent(content);
            var result = JsonSerializer.Deserialize<OpenAiCourseRecommendationResult>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
            return result ?? new OpenAiCourseRecommendationResult();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse OpenAI recommendation response");
            return new OpenAiCourseRecommendationResult();
        }
    }

    private static string NormalizeJsonContent(string content)
    {
        var trimmed = content.Trim();

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            return trimmed;
        }

        var firstNewline = trimmed.IndexOf('\n');
        if (firstNewline < 0)
        {
            return trimmed.Trim('`');
        }

        var withoutFenceStart = trimmed[(firstNewline + 1)..];
        var fenceEnd = withoutFenceStart.LastIndexOf("```", StringComparison.Ordinal);
        if (fenceEnd < 0)
        {
            return withoutFenceStart.Trim();
        }

        return withoutFenceStart[..fenceEnd].Trim();
    }

    private string BuildPrompt(string activityDescription, string activityText, string solvedText, int activityDocCount, int solvedDocCount)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Task: Summarize the submission and list good and bad points.");
        builder.AppendLine("If the submission text is unrelated to the assessment, set goodPoints to an empty string and say so in badPoints.");
        builder.AppendLine("Do not mention screenshots, images, videos, or other media.");
        builder.AppendLine("Return JSON with keys: summary (string), goodPoints (string), badPoints (string).");
        builder.AppendLine();
        builder.AppendLine("Activity description:");
        builder.AppendLine(string.IsNullOrWhiteSpace(activityDescription) ? "(none)" : activityDescription.Trim());
        builder.AppendLine();
        builder.AppendLine($"Activity documents extracted text ({activityDocCount}):");
        builder.AppendLine(string.IsNullOrWhiteSpace(activityText) ? "(none)" : activityText.Trim());
        builder.AppendLine();
        builder.AppendLine($"Submission documents extracted text ({solvedDocCount}):");
        builder.AppendLine(string.IsNullOrWhiteSpace(solvedText) ? "(none)" : solvedText.Trim());

        var full = builder.ToString();
        if (full.Length <= _openAiOptions.MaxInputChars)
        {
            return full;
        }

        return full[.._openAiOptions.MaxInputChars];
    }

    private async Task<(string Text, int DocCount)> ExtractDocumentsText(IEnumerable<Domain.Entities.ActivityDocument> documents, CancellationToken cancellationToken)
    {
        var builder = new StringBuilder();
        var docCount = 0;

        foreach (var document in documents.Take(_openAiOptions.MaxDocs))
        {
            var content = await TryExtractTextFromDocument(document.Bucket, document.Key, document.OriginalName, document.ContentType, cancellationToken);
            if (string.IsNullOrWhiteSpace(content))
            {
                continue;
            }

            docCount++;
            builder.AppendLine($"--- {document.OriginalName} ---");
            builder.AppendLine(content.Trim());
            builder.AppendLine();

            if (builder.Length >= _openAiOptions.MaxInputChars)
            {
                break;
            }
        }

        return (LimitText(builder.ToString(), _openAiOptions.MaxInputChars), docCount);
    }

    private async Task<(string Text, int DocCount)> ExtractDocumentsText(IEnumerable<Domain.Entities.SolvedActivityDocument> documents, CancellationToken cancellationToken)
    {
        var builder = new StringBuilder();
        var docCount = 0;

        foreach (var document in documents.Take(_openAiOptions.MaxDocs))
        {
            var content = await TryExtractTextFromDocument(document.Bucket, document.Key, document.OriginalName, document.ContentType, cancellationToken);
            if (string.IsNullOrWhiteSpace(content))
            {
                continue;
            }

            docCount++;
            builder.AppendLine($"--- {document.OriginalName} ---");
            builder.AppendLine(content.Trim());
            builder.AppendLine();

            if (builder.Length >= _openAiOptions.MaxInputChars)
            {
                break;
            }
        }

        return (LimitText(builder.ToString(), _openAiOptions.MaxInputChars), docCount);
    }

    private async Task<string> TryExtractTextFromDocument(string? bucket, string key, string originalName, string? contentType, CancellationToken cancellationToken)
    {
        try
        {
            var extension = Path.GetExtension(originalName).ToLowerInvariant();

            if (IsDocx(contentType, extension))
            {
                var docxText = await ExtractTextFromDocx(key, cancellationToken);
                return LimitText(docxText, _openAiOptions.MaxDocChars);
            }

            if (IsPdf(contentType, extension))
            {
                var pdfText = await ExtractTextFromPdf(key, cancellationToken);
                return LimitText(pdfText, _openAiOptions.MaxDocChars);
            }

            if (IsZip(contentType, extension))
            {
                return await ExtractTextFromZip(key, cancellationToken);
            }

            if (!IsTextDocument(contentType, extension))
            {
                return string.Empty;
            }

            var text = await DownloadTextObject(key, cancellationToken);
            return LimitText(text, _openAiOptions.MaxDocChars);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract document text for {OriginalName} ({Key})", originalName, key);
            return string.Empty;
        }
    }

    private async Task<string> DownloadTextObject(string key, CancellationToken cancellationToken)
    {
        var url = await _uploadPresignService.PresignGetAsync(key, cancellationToken);
        var client = _httpClientFactory.CreateClient();
        using var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var reader = new StreamReader(await response.Content.ReadAsStreamAsync(cancellationToken), Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: false);
        var text = await reader.ReadToEndAsync(cancellationToken);
        return text;
    }

    private async Task<string> ExtractTextFromZip(string key, CancellationToken cancellationToken)
    {
        var url = await _uploadPresignService.PresignGetAsync(key, cancellationToken);
        var client = _httpClientFactory.CreateClient();
        using var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        var contentLength = response.Content.Headers.ContentLength;
        if (contentLength.HasValue && contentLength.Value > _openAiOptions.MaxZipBytes)
        {
            return string.Empty;
        }

        await using var memory = new MemoryStream();
        await response.Content.CopyToAsync(memory, cancellationToken);
        if (memory.Length > _openAiOptions.MaxZipBytes)
        {
            return string.Empty;
        }
        memory.Position = 0;

        using var archive = new ZipArchive(memory, ZipArchiveMode.Read, leaveOpen: false);
        var builder = new StringBuilder();
        var totalChars = 0;

        foreach (var entry in archive.Entries)
        {
            if (entry.Length == 0)
            {
                continue;
            }

            try
            {
                var entryExtension = Path.GetExtension(entry.Name).ToLowerInvariant();
                if (!IsTextDocument(null, entryExtension))
                {
                    continue;
                }

                using var entryStream = entry.Open();
                using var reader = new StreamReader(entryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: false);
                var text = await reader.ReadToEndAsync(cancellationToken);
                text = LimitText(text, _openAiOptions.MaxDocChars);

                if (!string.IsNullOrWhiteSpace(text))
                {
                    builder.AppendLine($"--- {entry.FullName} ---");
                    builder.AppendLine(text.Trim());
                    builder.AppendLine();
                    totalChars += text.Length;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read zip entry {EntryName} in {Key}", entry.FullName, key);
                continue;
            }

            if (totalChars >= _openAiOptions.MaxDocChars)
            {
                break;
            }
        }

        return builder.ToString();
    }

    private async Task<string> ExtractTextFromPdf(string key, CancellationToken cancellationToken)
    {
        var url = await _uploadPresignService.PresignGetAsync(key, cancellationToken);
        var client = _httpClientFactory.CreateClient();
        using var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = PdfDocument.Open(stream);
        var builder = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            builder.AppendLine(page.Text);

            if (builder.Length >= _openAiOptions.MaxDocChars)
            {
                break;
            }
        }

        return builder.ToString();
    }

    private async Task<string> ExtractTextFromDocx(string key, CancellationToken cancellationToken)
    {
        var url = await _uploadPresignService.PresignGetAsync(key, cancellationToken);
        var client = _httpClientFactory.CreateClient();
        using var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = WordprocessingDocument.Open(stream, false);
        var body = document.MainDocumentPart?.Document?.Body;
        if (body == null)
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        foreach (var text in body.Descendants<Text>())
        {
            if (!string.IsNullOrWhiteSpace(text.Text))
            {
                builder.AppendLine(text.Text);
            }

            if (builder.Length >= _openAiOptions.MaxDocChars)
            {
                break;
            }
        }

        return builder.ToString();
    }

    private static bool IsTextDocument(string? contentType, string extension)
    {
        if (!string.IsNullOrWhiteSpace(contentType) && TextContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            return true;
        }

        return TextExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsZip(string? contentType, string extension)
    {
        if (!string.IsNullOrWhiteSpace(contentType) && contentType.Equals("application/zip", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return extension.Equals(".zip", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPdf(string? contentType, string extension)
    {
        if (!string.IsNullOrWhiteSpace(contentType) && contentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDocx(string? contentType, string extension)
    {
        if (!string.IsNullOrWhiteSpace(contentType) && contentType.Equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return extension.Equals(".docx", StringComparison.OrdinalIgnoreCase);
    }

    private static string LimitText(string text, int maxChars)
    {
        if (text.Length <= maxChars)
        {
            return text;
        }

        return text[..maxChars];
    }

    private static OpenAiSolvedActivityFeedback ParseResponse(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;
        var content = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var contentDoc = JsonDocument.Parse(content);
        var contentRoot = contentDoc.RootElement;

        return new OpenAiSolvedActivityFeedback
        {
            Summary = NormalizeText(contentRoot.GetProperty("summary").GetString()),
            GoodPoints = contentRoot.TryGetProperty("goodPoints", out var goodPoints)
                ? NormalizeText(goodPoints.GetString())
                : string.Empty,
            BadPoints = contentRoot.TryGetProperty("badPoints", out var badPoints)
                ? NormalizeText(badPoints.GetString())
                : string.Empty
        };
    }

    private static string NormalizeText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var builder = new StringBuilder(text.Length);
        var lastWasSpace = false;

        foreach (var ch in text)
        {
            if (char.IsWhiteSpace(ch))
            {
                if (!lastWasSpace)
                {
                    builder.Append(' ');
                    lastWasSpace = true;
                }

                continue;
            }

            builder.Append(ch);
            lastWasSpace = false;
        }

        return builder.ToString().Trim();
    }
}
