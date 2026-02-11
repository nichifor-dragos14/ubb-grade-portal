using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UBBGradePortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssistedLlmEvaluationFlagOnCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AssistedLlmEvaluation",
                table: "Courses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssistedLlmEvaluation",
                table: "Courses");
        }
    }
}
