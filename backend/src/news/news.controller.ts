import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { NewsService } from "./news.service";

const CACHE = "public, s-maxage=60, stale-while-revalidate=300";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@Controller("news")
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  @Header("Cache-Control", CACHE)
  list(
    @Query("category") category?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("cursor") cursor?: string,
    @Query("size") size?: string,
  ) {
    const s = Number(size ?? 20);
    if (!Number.isInteger(s) || s < 1 || s > 50) {
      throw new BadRequestException("size must be 1..50");
    }
    for (const [name, v] of [
      ["from", from],
      ["to", to],
    ] as const) {
      if (v !== undefined && !ISO_DATE.test(v)) {
        throw new BadRequestException(`${name} must be YYYY-MM-DD`);
      }
    }
    return this.news.list({ category, from, to, cursor, size: s });
  }

  @Get("categories")
  @Header("Cache-Control", CACHE)
  categories() {
    return this.news.categories();
  }

  /* static segment above is declared first — route order matters */
  @Get(":slug")
  @Header("Cache-Control", CACHE)
  bySlug(@Param("slug") slug: string) {
    return this.news.bySlug(slug);
  }

  @Post(":slug/view")
  @HttpCode(204)
  async view(@Param("slug") slug: string) {
    await this.news.registerView(slug);
  }
}
