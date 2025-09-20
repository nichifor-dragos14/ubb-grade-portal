using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Infrastructure.Auth;

namespace UBBGradePortal.WebApi.Auth;

public sealed class TokenService
{
    private readonly IConfiguration _configuration;
    private readonly IUserService _userService;

    public TokenService(
        IConfiguration configuration,
        IUserService userService
    )
    {
        _configuration = configuration;
        _userService = userService;
    }

    public async Task<string> CreateAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var profile = await _userService.GetById(user.Id, cancellationToken);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, profile is null ? user.UserName ?? user.Email ?? "" : $"{profile.FirstName} {profile.LastName}")
        };

        if (profile is not null)
        {
            claims.Add(new Claim(ClaimTypes.Role, profile.Role.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:AccessTokenMinutes"] ?? "60")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
