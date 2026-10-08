import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {ConfigModule} from '@nestjs/config';
import {DbModule} from './db/db.module.js';
import { AthletesModule } from './athletes/athletes.module.js';
import { SessionsModule } from './sessions/sessions.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
   imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, AthletesModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
