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
import { ArticlesService } from "./articles.service";

const CACHE = "public, s-maxage=60, stale-while-revalidate=300";

@Controller("articles")
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  @Header("Cache-Control", CACHE)
  list(
    @Query("category") category?: string,
    @Query("author") author?: string,
    @Query("page") page?: string,
    @Query("size") size?: string,
  ) {
    const p = Number(page ?? 1);
    const s = Number(size ?? 12);
    if (!Number.isInteger(p) || p < 1) throw new BadRequestException("page must be >= 1");
    if (!Number.isInteger(s) || s < 1 || s > 50) {
      throw new BadRequestException("size must be 1..50");
    }
    return this.articles.list({ category, author, page: p, size: s });
  }

  /* Static segments before ":slug" — Nest matches routes in declaration
     order, and "featured" is a valid slug shape. */
  @Get("featured")
  @Header("Cache-Control", CACHE)
  featured() {
    return this.articles.featured();
  }

  @Get("categories")
  @Header("Cache-Control", CACHE)
  categories() {
    return this.articles.categories();
  }

  @Get(":slug")
  @Header("Cache-Control", CACHE)
  bySlug(@Param("slug") slug: string) {
    return this.articles.bySlug(slug);
  }

  /* Counter ping from the site (proxied through its /api/views route).
     204 regardless of whether the slug exists — nothing to probe. */
  @Post(":slug/view")
  @HttpCode(204)
  async view(@Param("slug") slug: string) {
    await this.articles.registerView(slug);
  }
}
