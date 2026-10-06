import { httpClient } from '@/utils/http-client';
import type {
    TeamApproveResponse,
    TeamDeleteResponse,
    TeamRegenerateInviteResponse,
    TeamRejectRequest,
    TeamRejectResponse,
    TeamConfirmDonationResponse,
    TeamDetails,
    TeamInvitePreview,
    TeamJoinResponse,
    TeamLeaveResponse,
    TeamListFilters,
    TeamRegisterRequest,
    TeamRegisterResponse,
    TeamRemoveMemberResponse,
    TeamSelectCaptainResponse,
    TeamSubmitResponse,
    TeamSummary,
} from '@/types/team';

const BASE_PATH = '/team';

function unwrap<T>(data: T | undefined, message: string): T {
    if (data === undefined) {
        throw new Error(message);
    }
    return data;
}

class TeamService {
    async createTeam(request: TeamRegisterRequest): Promise<TeamRegisterResponse> {
        const form = new FormData();
        form.append('name', request.name);
        form.append('modality_id', request.modality_id);
        if (request.photo) {
            form.append('photo', request.photo as unknown as Blob);
        }

        const response = await httpClient.post<TeamRegisterResponse>(`${BASE_PATH}/`, form);

        return unwrap(response.data, 'O backend não retornou os dados do time criado');
    }

    async listTeams(filters?: TeamListFilters, signal?: AbortSignal): Promise<TeamSummary[]> {
        const params = new URLSearchParams();

        if (filters?.status) {
            params.set('status', filters.status);
        }
        if (filters?.season_id) {
            params.set('season_id', filters.season_id);
        }

        const query = params.toString();
        const endpoint = query ? `${BASE_PATH}/?${query}` : `${BASE_PATH}/`;

        const response = await httpClient.get<TeamSummary[]>(endpoint, { signal });

        return unwrap(response.data, 'O backend não retornou a lista de times');
    }

    async getTeamDetails(teamId: string, signal?: AbortSignal): Promise<TeamDetails> {
        const response = await httpClient.get<TeamDetails>(`${BASE_PATH}/${teamId}`, { signal });

        return unwrap(response.data, 'O backend não retornou os detalhes do time');
    }

    async submitTeam(teamId: string): Promise<TeamSubmitResponse> {
        const response = await httpClient.patch<TeamSubmitResponse>(`${BASE_PATH}/${teamId}/submit`);

        return unwrap(response.data, 'O backend não retornou os dados do time submetido');
    }

    async approveTeam(teamId: string): Promise<TeamApproveResponse> {
        const response = await httpClient.patch<TeamApproveResponse>(`${BASE_PATH}/${teamId}/approve`);

        return unwrap(response.data, 'O backend não retornou os dados do time aprovado');
    }

    async rejectTeam(teamId: string, request: TeamRejectRequest): Promise<TeamRejectResponse> {
        const response = await httpClient.patch<TeamRejectResponse>(`${BASE_PATH}/${teamId}/reject`, request);

        return unwrap(response.data, 'O backend não retornou os dados da rejeição do time');
    }

    async deleteTeam(teamId: string): Promise<TeamDeleteResponse> {
        const response = await httpClient.delete<TeamDeleteResponse>(`${BASE_PATH}/${teamId}`);

        return unwrap(response.data, 'O backend não retornou os dados da exclusão do time');
    }

    async regenerateInvite(teamId: string): Promise<TeamRegenerateInviteResponse> {
        const response = await httpClient.post<TeamRegenerateInviteResponse>(
            `${BASE_PATH}/${teamId}/invite/regenerate`
        );

        return unwrap(response.data, 'O backend não retornou o novo convite');
    }

    async confirmDonation(teamId: string, userId: string): Promise<TeamConfirmDonationResponse> {
        const response = await httpClient.patch<TeamConfirmDonationResponse>(
            `${BASE_PATH}/${teamId}/members/${userId}/confirm-donation`
        );

        return unwrap(response.data, 'O backend não retornou os dados da doação confirmada');
    }

    async getInviteInfo(inviteToken: string, signal?: AbortSignal): Promise<TeamInvitePreview> {
        const response = await httpClient.get<TeamInvitePreview>(
            `${BASE_PATH}/invite/${encodeURIComponent(inviteToken)}`,
            { signal }
        );

        return unwrap(response.data, 'O backend não retornou as informações do convite');
    }

    async joinViaInvite(inviteToken: string): Promise<TeamJoinResponse> {
        const response = await httpClient.post<TeamJoinResponse>(
            `${BASE_PATH}/invite/${encodeURIComponent(inviteToken)}/join`
        );

        return unwrap(response.data, 'O backend não retornou os dados da entrada no time');
    }

    async selectCaptain(teamId: string, userId: string): Promise<TeamSelectCaptainResponse> {
        const response = await httpClient.patch<TeamSelectCaptainResponse>(
            `${BASE_PATH}/${teamId}/members/${userId}/captain`
        );

        return unwrap(response.data, 'O backend não retornou os dados do capitão selecionado');
    }

    async removeMember(teamId: string, userId: string): Promise<TeamRemoveMemberResponse> {
        const response = await httpClient.delete<TeamRemoveMemberResponse>(
            `${BASE_PATH}/${teamId}/members/${userId}`
        );

        return unwrap(response.data, 'O backend não retornou os dados da remoção do membro');
    }

    async leaveTeam(teamId: string): Promise<TeamLeaveResponse> {
        const response = await httpClient.delete<TeamLeaveResponse>(`${BASE_PATH}/${teamId}/leave`);

        return unwrap(response.data, 'O backend não retornou os dados da saída do time');
    }
}

export const teamService = new TeamService();
