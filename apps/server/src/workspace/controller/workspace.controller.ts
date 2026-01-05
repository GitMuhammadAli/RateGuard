import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../system/decorator/current-user.decorator';
import { WorkspaceService } from '../service/workspace.service';
import {
  WorkspaceRoles,
  OwnerOnly,
  AdminOnly,
  MemberAccess,
} from '../decorators/workspace-roles.decorator';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  TransferOwnershipDto,
} from '../dto';

interface JwtUser {
  id: string;
  email: string;
}

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // ==========================================
  // WORKSPACE CRUD
  // ==========================================

  @Post()
  @ApiOperation({
    summary: 'Create workspace',
    description: 'Create a new workspace. The creator automatically becomes the OWNER.',
  })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List my workspaces',
    description: 'Get all workspaces where you are a member or owner.',
  })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async findAll(@CurrentUser() user: JwtUser) {
    return this.workspaceService.findAllForUser(user.id);
  }

  @Get(':workspaceId')
  @MemberAccess()
  @ApiOperation({
    summary: 'Get workspace details',
    description: 'Get workspace details. Requires VIEWER+ role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 403, description: 'Not a member' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findOne(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.findById(workspaceId);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get workspace by slug',
    description: 'Get workspace by its URL-friendly slug.',
  })
  @ApiParam({ name: 'slug', description: 'Workspace slug', example: 'my-startup' })
  async findBySlug(@Param('slug') slug: string) {
    return this.workspaceService.findBySlug(slug);
  }

  @Put(':workspaceId')
  @AdminOnly()
  @ApiOperation({
    summary: 'Update workspace',
    description: 'Update workspace details. Requires ADMIN+ role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(workspaceId, dto);
  }

  @Delete(':workspaceId')
  @OwnerOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete workspace',
    description: 'Soft delete the workspace. Requires OWNER role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace deleted' })
  @ApiResponse({ status: 403, description: 'Only owner can delete' })
  async delete(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.workspaceService.delete(workspaceId, user.id);
  }

  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================

  @Get(':workspaceId/members')
  @MemberAccess()
  @ApiOperation({
    summary: 'List workspace members',
    description: 'Get all members of the workspace. Requires VIEWER+ role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async listMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.listMembers(workspaceId);
  }

  @Post(':workspaceId/members/invite')
  @AdminOnly()
  @ApiOperation({
    summary: 'Invite member',
    description: 'Invite a user to the workspace by email. Requires ADMIN+ role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 409, description: 'User already a member or invitation pending' })
  async inviteMember(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspaceService.inviteMember(workspaceId, user.id, dto);
  }

  @Put(':workspaceId/members/:memberId/role')
  @OwnerOnly()
  @ApiOperation({
    summary: 'Update member role',
    description: 'Change a member\'s role. Requires OWNER role. Cannot change owner\'s role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID (not user UUID)' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Cannot change owner role' })
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspaceService.updateMemberRole(
      workspaceId,
      memberId,
      user.id,
      dto,
    );
  }

  @Delete(':workspaceId/members/:memberId')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove member',
    description: 'Remove a member from the workspace. Requires ADMIN+ role. Cannot remove owner.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID (not user UUID)' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove owner' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.workspaceService.removeMember(workspaceId, memberId, user.id);
  }

  @Post(':workspaceId/leave')
  @MemberAccess()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Leave workspace',
    description: 'Leave the workspace. Owner cannot leave (must transfer ownership first).',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Left workspace' })
  @ApiResponse({ status: 400, description: 'Owner cannot leave' })
  async leave(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.workspaceService.leave(workspaceId, user.id);
  }

  @Post(':workspaceId/transfer-ownership')
  @OwnerOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transfer ownership',
    description: 'Transfer workspace ownership to another member. Requires OWNER role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
  @ApiResponse({ status: 400, description: 'New owner must be a member' })
  async transferOwnership(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.workspaceService.transferOwnership(workspaceId, user.id, dto);
  }

  // ==========================================
  // INVITATIONS
  // ==========================================

  @Get(':workspaceId/invitations')
  @AdminOnly()
  @ApiOperation({
    summary: 'List pending invitations',
    description: 'Get all pending invitations. Requires ADMIN+ role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async listInvitations(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.listInvitations(workspaceId);
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel invitation',
    description: 'Cancel a pending invitation. Requires ADMIN+ role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID' })
  async cancelInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.workspaceService.cancelInvitation(workspaceId, invitationId);
  }
}

/**
 * Separate controller for invitation acceptance (doesn't require workspace context)
 */
@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accept a workspace invitation using the token from the invite email.',
  })
  @ApiResponse({ status: 200, description: 'Joined workspace' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async acceptInvitation(
    @CurrentUser() user: JwtUser,
    @Query('token') token: string,
  ) {
    return this.workspaceService.acceptInvitation(user.id, token);
  }

  @Post('decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline invitation',
    description: 'Decline a workspace invitation.',
  })
  @ApiResponse({ status: 200, description: 'Invitation declined' })
  async declineInvitation(
    @CurrentUser() user: JwtUser,
    @Query('token') token: string,
  ) {
    return this.workspaceService.declineInvitation(user.id, token);
  }
}

