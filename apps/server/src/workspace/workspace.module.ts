import { Module } from '@nestjs/common';
import { WorkspaceController, InvitationController } from './controller/workspace.controller';
import { WorkspaceService } from './service/workspace.service';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../system/module/email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [WorkspaceController, InvitationController],
  providers: [WorkspaceService, WorkspaceRoleGuard],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

