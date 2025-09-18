using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Domain.Entities;
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

        // validate: make sure the courses exist and no courses are already enrolled for the user; validate user info

        if (!create.Succeeded)
        {
            return BadRequest(string.Join("; ", create.Errors.Select(e => e.Description)));
        }

        var roleName = request.Role.ToString();

        if (!await _roles.RoleExistsAsync(roleName))
        {
            await _roles.CreateAsync(new ApplicationRole { Name = roleName, NormalizedName = roleName.ToUpperInvariant() });
        }

        await _users.AddToRoleAsync(applicationUser, roleName);

        var newUser = new User
        {
            Id = applicationUser.Id,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Role = request.Role,
            CreatedOn = DateTime.UtcNow
        };

        await _userService.Add(newUser, cancellationToken);
        await _userService.EnrollToCourses(applicationUser.Id, request.CourseIds, cancellationToken);

        var jwt = await _tokenService.CreateAsync(applicationUser, cancellationToken);

        return Ok(new AuthResponse(jwt));
    }

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

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdString))
        {
            return Unauthorized();
        }

        var userId = Guid.Parse(userIdString);
        var user = await _userService.GetById(userId, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        return Ok(
            new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role
            }
        );
    }
}
