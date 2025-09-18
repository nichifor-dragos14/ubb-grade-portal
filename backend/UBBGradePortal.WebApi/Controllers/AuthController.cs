using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Auth;
using UBBGradePortal.WebApi.Auth;

namespace UBBGradePortal.WebApi.Controllers;

public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly RoleManager<ApplicationRole> _roles;
    private readonly IUserService _userService;
    private readonly TokenService _tokenService;

    public AccountController(
        UserManager<ApplicationUser> users,
        RoleManager<ApplicationRole> roles,
        IUserService userService,
        TokenService tokenService
    )
    {
        _users = users;
        _roles = roles;
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest req,
        CancellationToken ct
    )
    {
        var appUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = req.Email,
            Email = req.Email
        };

        var create = await _users.CreateAsync(appUser, req.Password);

        // validate courses exist and no courses are already enrolled for user; validate user info

        if (!create.Succeeded)
        {
            return BadRequest(string.Join("; ", create.Errors.Select(e => e.Description)));
        }

        var roleName = req.Role.ToString();

        if (!await _roles.RoleExistsAsync(roleName))
        {
            await _roles.CreateAsync(new ApplicationRole { Name = roleName, NormalizedName = roleName.ToUpperInvariant() });
        }

        await _users.AddToRoleAsync(appUser, roleName);

        var newUser = new User
        {
            Id = appUser.Id,
            FirstName = req.FirstName,
            LastName = req.LastName,
            Email = req.Email,
            Role = req.Role,
            CreatedOn = DateTime.UtcNow
        };

        await _userService.Add(newUser);
        await _userService.EnrollToCourses(appUser.Id, req.CourseIds);

        var jwt = await _tokenService.CreateAsync(appUser, ct);

        return Ok(new AuthResponse(jwt));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest req,
        CancellationToken ct
    )
    {
        var user = await _users.FindByEmailAsync(req.Email);

        if (user is null)
        {
            return Unauthorized("Invalid credentials.");
        }

        var valid = await _users.CheckPasswordAsync(user, req.Password);

        if (!valid)
        {
            return Unauthorized("Invalid credentials.");
        }

        var jwt = await _tokenService.CreateAsync(user, ct);

        return Ok(new AuthResponse(jwt));
    }

    //[HttpGet("me")]
    //[Authorize]
    //public async Task<IActionResult> Me(
    //    CancellationToken ct
    //)
    //{
    //    var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

    //    if (string.IsNullOrWhiteSpace(userIdString))
    //    {
    //        return Unauthorized();
    //    }

    //    var userId = Guid.Parse(userIdString);
    //    var user = _userService.GetById(userId);

    //    if (user is null)
    //    {
    //        return NotFound();
    //    }

    //    return Ok(
    //        new 
    //        { 
    //            u.Id,
    //            u.FirstName,
    //            u.LastName,
    //            u.Email,
    //            u.Role
    //            u.Courses
    //        }
    //    );
    //}
}
