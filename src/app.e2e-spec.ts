import * as request from 'supertest'

describe('AppController (e2e)', () => {
  beforeAll(async () => {
    // for example
    // mailService = global.rootModule.get(MailService);
  })

  afterAll(async () => {
    jest.clearAllMocks()
  })

  it('/welcome (GET)', async () => {
    const { body, status } = await request(global.app.getHttpServer()).get('/welcome').expect(200)
    expect(status).toEqual(200)
    expect(body).toEqual({ data: 'Welcome!' })
  })
})
