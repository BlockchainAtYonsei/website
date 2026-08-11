import { BadRequestException, Controller, Get, Header, Param, Query } from "@nestjs/common";
import type { MemberStatus } from "../generated/prisma/enums";
import { MembersService } from "./members.service";

const CACHE = "public, s-maxage=60, stale-while-revalidate=300";

@Controller("members")
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @Header("Cache-Control", CACHE)
  list(
    @Query("cohort") cohort?: string,
    @Query("team") team?: string,
    @Query("status") status?: string,
    @Query("writers") writers?: string,
  ) {
    if (cohort !== undefined && !Number.isInteger(Number(cohort))) {
      throw new BadRequestException("cohort must be an integer");
    }
    if (status !== undefined && status !== "active" && status !== "alumni") {
      throw new BadRequestException("status must be active or alumni");
    }
    return this.members.list({
      cohort: cohort !== undefined ? Number(cohort) : undefined,
      team,
      status: status as MemberStatus | undefined,
      writers: writers === "1",
    });
  }

  @Get(":slug")
  @Header("Cache-Control", CACHE)
  bySlug(@Param("slug") slug: string) {
    return this.members.bySlug(slug);
  }
}
