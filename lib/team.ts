import "server-only";
import sql from "./db";

export type TeamMember = {
  id: number;
  name: string;
  email: string;
};

export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  return sql<TeamMember[]>`
    select id, name, email from users where team_id = ${teamId} order by name
  `;
}
