import { Controller, Get, Inject, Post } from '@nestjs/common'
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus'
// import { INotificationService } from '@notification/services/notification.service'
import { AppService } from '@src/app.service'
// import { HelperService } from '@common/services/helper.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthCheckService: HealthCheckService,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly mongooseHealthIndicator: MongooseHealthIndicator,
    // private readonly helperService: HelperService
    // @Inject(INotificationService)
    // private readonly notificationService: INotificationService
  ) {}

  @Get('welcome')
  getWelcome(): string {
    return this.appService.getI18nText()
  }

  // @Post('cert')
  // async cert() {
  //   const data = {
  //     learnerName: 'Vo Minh Tien',
  //     courseTitle: 'Wild and Industrial Orchid Care Course',
  //     dateCompleted: 'July, 23 2021',
  //     certificateCode: 'BS182903344',
  //     instructorName: 'Nguyen Ngoc Anh',
  //     instructorSignature: 'https://res.cloudinary.com/orchidify/image/upload/v1731113221/gdqqxchgrail8mrpkhwa.png'
  //   }

  //   await this.helperService.generatePDF({
  //     data,
  //     templatePath: './templates/learner/certificate.ejs',
  //     certificatePath: 'certs/cert.pdf'
  //   })

  //   console.log('PDF file generated successfully.')
  // }

  // @Post('noti')
  // async noti() {
  //   const data = {
  //     title: 'Title notification',
  //     body: 'Body notification',
  //     data: {},
  //     receiverIds: ['66d8921faf503bca4c5627a5'],
  //   }

  //   await this.notificationService.sendFirebaseCloudMessaging(data)

  //   console.log('Send noti successfully.')
  // }

  @Get('health')
  @HealthCheck()
  healthCheck() {
    return this.healthCheckService.check([
      () => this.mongooseHealthIndicator.pingCheck('mongodb'),
      () => this.memoryHealthIndicator.checkHeap('memory_heap', 150 * 1024 * 1024)
    ])
  }
}
