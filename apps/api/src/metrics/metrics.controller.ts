import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';
import { QueryMetricsDto } from './dto/query-metrics.dto';
import { MetricsService } from './metrics.service';

@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(@CurrentUser() user: AuthUser, @Query() query: QueryMetricsDto) {
    assertAdminEmail(user.email);
    return this.metricsService.getMetrics(query);
  }
}
