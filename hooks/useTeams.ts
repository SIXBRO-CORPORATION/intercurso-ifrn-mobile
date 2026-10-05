import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamService } from '@/services/team.service';
import { queryKeys } from '@/utils/query-keys';
import { ApiError } from '@/types/api';
import type { TeamListFilters, TeamRegisterRequest } from '@/types/team';

function isClientError(error: unknown): boolean {
    return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function useTeams(filters?: TeamListFilters) {
    return useQuery({
        queryKey: queryKeys.teams.list(filters),
        queryFn: ({ signal }) => teamService.listTeams(filters, signal),
    });
}

export function useTeamDetails(teamId: string) {
    return useQuery({
        queryKey: queryKeys.teams.detail(teamId),
        queryFn: ({ signal }) => teamService.getTeamDetails(teamId, signal),
        enabled: !!teamId,
    });
}

export function useTeamInviteInfo(inviteToken: string) {
    return useQuery({
        queryKey: queryKeys.teams.invite(inviteToken),
        queryFn: ({ signal }) => teamService.getInviteInfo(inviteToken, signal),
        enabled: !!inviteToken,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    });
}

export function useCreateTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: TeamRegisterRequest) => teamService.createTeam(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        },
    });
}

interface TeamIdVariables {
    teamId: string;
}

interface TeamMemberVariables extends TeamIdVariables {
    userId: string;
}

export function useSubmitTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId }: TeamIdVariables) => teamService.submitTeam(teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}

export function useApproveTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId }: TeamIdVariables) => teamService.approveTeam(teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}

export function useConfirmDonation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId, userId }: TeamMemberVariables) =>
            teamService.confirmDonation(teamId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        },
    });
}

interface JoinTeamVariables {
    inviteToken: string;
}

export function useJoinTeamViaInvite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ inviteToken }: JoinTeamVariables) => teamService.joinViaInvite(inviteToken),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        },
    });
}

export function useSelectCaptain() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId, userId }: TeamMemberVariables) =>
            teamService.selectCaptain(teamId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        },
    });
}

export function useRemoveTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId, userId }: TeamMemberVariables) =>
            teamService.removeMember(teamId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        },
    });
}

export function useLeaveTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId }: TeamIdVariables) => teamService.leaveTeam(teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        },
    });
}
