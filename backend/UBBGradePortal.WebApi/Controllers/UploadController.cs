using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Upload;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IUploadPresignService _uploadPresignService;

    public UploadController(
        IUploadPresignService uploadPresignService
    )
    {
        _uploadPresignService = uploadPresignService;
    }

    [HttpPost("presign")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<PresignResponseDto>, BadRequest<string>, ForbidHttpResult>> Presign(
        [FromBody] PresignRequestDto request,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(request.Filename))
        {
            return TypedResults.BadRequest("Filename is required.");
        }

        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out _))
        {
            return TypedResults.Forbid();
        }

        var (url, key) = await _uploadPresignService.PresignPutAsync(
            request.Filename,
            request.ContentType,
            loggedUserIdValue,
            request.TenantId,
            cancellationToken
        );

        return TypedResults.Ok(new PresignResponseDto(url,key));
    }

    [HttpPost("presign-get")]
    [Authorize(Roles = "Student,Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<string>, BadRequest<string>>> PresignGet(
        [FromBody] PresignGetRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var key = request.Key;

        if (string.IsNullOrWhiteSpace(key))
        { 
            return TypedResults.BadRequest("Key is required."); 
        }

        var url = await _uploadPresignService.PresignGetAsync(key, cancellationToken);

        return TypedResults.Ok(url);
    }

    [HttpPost("presign-delete")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<string>, BadRequest<string>, ForbidHttpResult>> PresignDelete(
        [FromBody] PresignDeleteRequestDto request,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(request.Key))
        {
            return TypedResults.BadRequest("Key is required.");
        }

        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // TODO: verify user can delete this
        if (!Guid.TryParse(loggedUserIdValue, out _))
        {
            return TypedResults.Forbid();
        }

        var url = await _uploadPresignService.PresignDeleteAsync(request.Key, cancellationToken);

        return TypedResults.Ok(url);
    }
}