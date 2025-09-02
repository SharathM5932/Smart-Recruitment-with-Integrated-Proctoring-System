import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async dashboard() {
    const data = await this.dashboardService.dashboard();

    return {
      statusCode: '200',
      message: 'Dashboard data retrieved successfully.',
      data: data,
    };
  }
}
