// Docker
// import { ConfigService } from '@nestjs/config';
// import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// // necessary configuration
// export const getTypeOrmConfig = (
//   configService: ConfigService,
// ): TypeOrmModuleOptions => ({
//   type: 'postgres',
//   host: configService.get<string>('DB_HOST'),
//   port: parseInt(configService.get<string>('DB_PORT')!, 10),
//   username: configService.get<string>('DB_USERNAME'),
//   password: configService.get<string>('DB_PASSWORD'),
//   database: configService.get<string>('DB_NAME'),
//   //   ssl: {
//   //     rejectUnauthorized: false,
//   //   },

//   // Automatically load all entity files
//   autoLoadEntities: true,

//   // If you're using synchronize: false (recommended for production), run migrations:
//   // npx typeorm migration:run
//   synchronize: true,

//   // Enable query logging in dev only (remove or conditionally control in prod)
//   logging: false,
// });

// Cockroach db
// import { ConfigService } from '@nestjs/config';
// import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// export const getTypeOrmConfig = (
//   configService: ConfigService,
// ): TypeOrmModuleOptions => ({
//   type: 'postgres',

//   // Use the single URI
//   url: configService.get<string>('DATABASE_URL'),

//   // Optional SSL (many cloud DBs require this)
//   ssl: {
//     rejectUnauthorized: false, // disable cert verification if needed
//   },

//   autoLoadEntities: true,
//   synchronize: true,
//   logging: false,
// });

import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// necessary configuration
export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: parseInt(configService.get<string>('DB_PORT')!, 10),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  ssl: {
    rejectUnauthorized: false,
  },

  // Automatically load all entity files
  autoLoadEntities: true,

  // If you're using synchronize: false (recommended for production), run migrations:
  // npx typeorm migration:run
  synchronize: true,

  // Enable query logging in dev only (remove or conditionally control in prod)
  logging: false,

  schema: 'public',
});
