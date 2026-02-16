using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Admin;
using UBBGradePortal.Application.DTOs.User;
using UBBGradePortal.Domain.Enums;
using UBBGradePortal.Infrastructure.Auth;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly UserManager<ApplicationUser> _users;
    private readonly RoleManager<ApplicationRole> _roles;

    public AdminController(
        IUserService userService,
        UserManager<ApplicationUser> users,
        RoleManager<ApplicationRole> roles
    )
    {
        _userService = userService;
        _users = users;
        _roles = roles;
    }

    [HttpGet("users")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<Results<Ok<List<AdminUserDto>>, BadRequest>> GetUsers(
        CancellationToken cancellationToken
    )
    {
        var users = await _userService.GetAll(cancellationToken);

        var result = users
            .Select(user => new AdminUserDto(
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role.ToString(),
                user.IsBanned))
            .ToList();

        return TypedResults.Ok(result);
    }

    [HttpPut("users/{id:guid}/ban")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok, NotFound>> BanUser(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var success = await _userService.SetBanned(id, true, cancellationToken);

        return success ? TypedResults.Ok() : TypedResults.NotFound();
    }

    [HttpPut("users/{id:guid}/unban")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok, NotFound>> UnbanUser(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var success = await _userService.SetBanned(id, false, cancellationToken);

        return success ? TypedResults.Ok() : TypedResults.NotFound();
    }

    [HttpPost("professors")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<CreateProfessorResponse>, BadRequest<string>>> CreateProfessor(
        [FromBody] CreateProfessorRequest request,
        CancellationToken cancellationToken
    )
    {
        var applicationUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email
        };

        var create = await _users.CreateAsync(applicationUser, request.Password);

        if (!create.Succeeded)
        {
            return TypedResults.BadRequest(string.Join("; ", create.Errors.Select(e => e.Description)));
        }

        const string roleName = "Professor";

        if (!await _roles.RoleExistsAsync(roleName))
        {
            await _roles.CreateAsync(new ApplicationRole
            {
                Name = roleName,
                NormalizedName = roleName.ToUpperInvariant()
            });
        }

        await _users.AddToRoleAsync(applicationUser, roleName);

        var user = new AddUserDto(
            applicationUser.Id,
            request.FirstName,
            request.LastName,
            request.Email,
            Role.Professor
        );

        await _userService.Add(user, cancellationToken);

        return TypedResults.Ok(new CreateProfessorResponse(user.Id));
    }
}
