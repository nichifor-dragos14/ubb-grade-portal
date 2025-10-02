using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Upload;

namespace UBBGradePortal.WebApi.Controllers
{
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
        //[Authorize(Roles = "Professor")]
        public async Task<Results<Ok<PresignResponseDto>, BadRequest<string>>> Presign(
            [FromBody] PresignRequestDto request,
            CancellationToken cancellationToken
        )
        {
            if (string.IsNullOrWhiteSpace(request.Filename))
            {
                return TypedResults.BadRequest("Filename is required.");
            }

            var loggedUserId = User.Identity.GetUserId();

            var (url, key) = await _uploadPresignService.PresignPutAsync(
                request.Filename,
                request.ContentType,
                loggedUserId,
                request.TenantId,
                cancellationToken
            );

            return TypedResults.Ok(new PresignResponseDto(url,key));
        }

        [HttpPost("presign-get")]
        [Authorize]
        public async Task<Results<Ok<string>, BadRequest<string>>> PresignGet(
            [FromBody] string key,
            CancellationToken cancellationToken
        )
        {
            if (string.IsNullOrWhiteSpace(key))
            { 
                return TypedResults.BadRequest("Key is required."); 
            }

            var url = await _uploadPresignService.PresignGetAsync(key, cancellationToken);

            return TypedResults.Ok(url);
        }
    }
}