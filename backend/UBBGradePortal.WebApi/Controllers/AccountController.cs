using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Auth;
using UBBGradePortal.Application.DTOs.User;
using UBBGradePortal.Infrastructure.Auth;
using UBBGradePortal.WebApi.Auth;

namespace UBBGradePortal.WebApi.Controllers;

public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly RoleManager<ApplicationRole> _roles;
    private readonly TokenService _tokenService;
    private readonly IUserService _userService;

    public AccountController(
        UserManager<ApplicationUser> users,
        RoleManager<ApplicationRole> roles,
        TokenService tokenService,
        IUserService userService
    )
    {
        _users = users;
        _roles = roles;
        _tokenService = tokenService;
        _userService = userService;
    }

    /// <summary> User registration </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
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
            return BadRequest(string.Join("; ", create.Errors.Select(e => e.Description)));
        }

        var roleName = request.Role.ToString();

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
            request.Role
        );

        await _userService.Add(user, cancellationToken);

        if (request.CourseIds != null && request.CourseIds.Count != 0)
        {
            await _userService.EnrollToCourses(applicationUser.Id, request.CourseIds, cancellationToken);
        }

        return Ok(new RegisterResponse(user.Id));
    }

    /// <summary> User login </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken
    )
    {
        var user = await _users.FindByEmailAsync(request.Email);

        if (user is null)
        {
            return Unauthorized("Invalid credentials.");
        }

        var valid = await _users.CheckPasswordAsync(user, request.Password);

        if (!valid)
        {
            return Unauthorized("Invalid credentials.");
        }

        var jwt = await _tokenService.CreateAsync(user, cancellationToken);

        return Ok(new AuthResponse(jwt));
    }
}
