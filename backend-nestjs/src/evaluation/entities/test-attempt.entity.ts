// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
//   UpdateDateColumn,
//   JoinColumn,
// } from 'typeorm';
// import { Applicant } from './applicants.entity';
// import { Job } from 'src/jobs/entities/job.entity';
// import { User } from 'src/users/entities/user.entity';
// import { McqQuestion } from 'src/question-bank/entities/question.entity';

// @Entity('test_attempts')
// export class TestAttempt {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(() => Applicant)
//   @JoinColumn({ name: 'applicant_id' })
//   applicant: Applicant;

//   @ManyToOne(() => Job)
//   @JoinColumn({ name: 'job_id' })
//   job: Job;

//   @ManyToOne(() => User)
//   @JoinColumn({ name: 'ta_id' })
//   ta: User;

//   @Column({ type: 'int', nullable: true })
//   mcq_score: number;

//   @Column({
//     type: 'enum',
//     enum: ['passed', 'failed'],
//     nullable: true,
//   })
//   coding_status_result: 'passed' | 'failed';

//   @Column({
//     type: 'enum',
//     enum: ['pending', 'attending', 'completed'],
//     default: 'pending',
//   })
//   test_status: 'pending' | 'attending' | 'completed';

//   @Column({ type: 'timestamp' })
//   schedule_start: Date;

//   @Column({ type: 'timestamp' })
//   schedule_end: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   actual_applicant_answered_at: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   applicant_completed_at: Date;

//   @Column({ type: 'int', default: 30 })
//   coding_duration_minutes: number;

//   @Column({ type: 'int', default: 15 })
//   mcq_duration_minutes: number;

//   @Column({ type: 'int', default: 45 })
//   total_duration_minutes: number;

//   @Column({ type: 'int', default: 0 })
//   attempt_count: number;

//   @Column({ type: 'boolean', default: false })
//   is_submitted: boolean;

//   @CreateDateColumn()
//   created_at: Date;

//   @UpdateDateColumn()
//   updated_at: Date;
// }

import { Job } from 'src/jobs/entities/job.entity';
import { Submission } from 'src/problem/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from './applicants.entity';
import { TestAccessToken } from './test-access-token.entity';
@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Applicant, (applicant) => applicant.test_attempts)
  @JoinColumn({ name: 'applicant_id' })
  applicant: Applicant;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ta_id' })
  ta: User;

  @Column({ type: 'int', nullable: true })
  mcq_score: number;

  @Column({
    type: 'enum',
    enum: ['passed', 'failed'],
    nullable: true,
  })
  coding_status_result: 'passed' | 'failed';

  @Column({
    type: 'enum',
    enum: ['pending', 'attending', 'completed'],
    default: 'pending',
  })
  test_status: 'pending' | 'attending' | 'completed';

  @Column({ type: 'timestamp' })
  schedule_start: Date;

  @Column({ type: 'timestamp' })
  schedule_end: Date;

  @Column({ type: 'timestamp', nullable: true })
  actual_applicant_answered_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  applicant_completed_at: Date;

  @Column({ type: 'int', default: 30 })
  coding_duration_minutes: number;

  @Column({ type: 'int', default: 15 })
  mcq_duration_minutes: number;

  @Column({ type: 'int', default: 45 })
  total_duration_minutes: number;

  @Column({ type: 'int', default: 0 })
  attempt_count: number;

  @Column({ type: 'boolean', default: false })
  is_submitted: boolean;

  @OneToMany(() => Submission, (submission) => submission.testAttempt)
  submissions: Submission[];

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  jobs: Job;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TestAccessToken, (token) => token.test_attempt, {
    cascade: true, // optional, if you want tokens to auto-save with attempts
  })
  test_access_tokens: TestAccessToken[];
}
