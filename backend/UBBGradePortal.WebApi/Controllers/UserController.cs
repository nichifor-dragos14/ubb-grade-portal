using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;

namespace UBBGradePortal.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(
            IUserService userService
        )
        {
            _userService = userService;
        }
    }
}