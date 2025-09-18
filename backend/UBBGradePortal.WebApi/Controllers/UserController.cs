using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost]
        public async Task<ActionResult<User>> Create([FromBody] User user)
        {
            // validation will be here

            // conversion will be here


            await _userService.Add(user);

            return CreatedAtAction(nameof(Create), new { id = user.Id }, user);
        }
    }
}