using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UBBGradePortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseAndActivityInformationToNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ActivityId",
                table: "Notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CourseId",
                table: "Notifications",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivityId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "Notifications");
        }
    }
}
