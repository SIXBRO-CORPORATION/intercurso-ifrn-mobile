import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '@/services/match.service';
import { queryKeys } from '@/utils/query-keys';
import type { MatchCardRequest, MatchGoalRequest, MatchPenaltyKickRequest } from '@/types/match';

interface MatchIdVariables {
    matchId: string;
}

interface RegisterGoalVariables extends MatchIdVariables {
    request: MatchGoalRequest;
}

interface RegisterCardVariables extends MatchIdVariables {
    request: MatchCardRequest;
}

interface RegisterPenaltyKickVariables extends MatchIdVariables {
    request: MatchPenaltyKickRequest;
}

interface DeleteMatchEventVariables extends MatchIdVariables {
    eventId: string;
}

export function useStartMatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.startMatch(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useRegisterGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId, request }: RegisterGoalVariables) =>
            matchService.registerGoal(matchId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useRegisterCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId, request }: RegisterCardVariables) =>
            matchService.registerCard(matchId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function usePauseClock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.pauseClock(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useResumeClock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.resumeClock(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useEndPeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.endPeriod(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useStartPeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.startPeriod(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useEndSet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.endSet(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useFinishMatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.finishMatch(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useStartPenaltyShootout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.startPenaltyShootout(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useRegisterPenaltyKick() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId, request }: RegisterPenaltyKickVariables) =>
            matchService.registerPenaltyKick(matchId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useEndPenaltyShootout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.endPenaltyShootout(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useUndoLastMatchEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId }: MatchIdVariables) => matchService.undoLastEvent(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useDeleteMatchEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId, eventId }: DeleteMatchEventVariables) =>
            matchService.deleteEvent(matchId, eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}
