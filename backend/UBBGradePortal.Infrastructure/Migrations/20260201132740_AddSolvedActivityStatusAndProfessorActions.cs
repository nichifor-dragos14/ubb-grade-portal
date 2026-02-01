using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UBBGradePortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSolvedActivityStatusAndProfessorActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Grade",
                table: "SolvedActivities",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ProfessorComment",
                table: "SolvedActivities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "SolvedActivities",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Grade",
                table: "SolvedActivities");

            migrationBuilder.DropColumn(
                name: "ProfessorComment",
                table: "SolvedActivities");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "SolvedActivities");
        }
    }
}
