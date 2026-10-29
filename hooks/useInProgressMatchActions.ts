import { useRef, useState } from 'react';
import {
    useEndPenaltyShootout,
    useEndPeriod,
    useEndSet,
    useFinishMatch,
    usePauseClock,
    useRegisterCard,
    useRegisterGoal,
    useRegisterPenaltyKick,
    useResumeClock,
    useStartPenaltyShootout,
    useStartPeriod,
    useUndoLastMatchEvent,
} from '@/hooks/useMatches';
import { useToast } from '@/providers/ToastProvider';
import type { MatchPublicResponse } from '@/types/match';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import type { BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { eventDeletionPreview } from '@/components/match/match-helpers';

type PendingAction = 'endPeriod' | 'endSet' | 'endPenaltyShootout' | 'startPenaltyShootout' | null;

function undoPreview(match: MatchPublicResponse): { title: string; description: string } {
    const last = match.timeline[match.timeline.length - 1];
    if (!last) {
        return {
            title: 'Desfazer último evento?',
            description: 'O último evento registrado nesta partida será removido.',
        };
    }
    return eventDeletionPreview(match, last);
}

export function useInProgressMatchActions(match: MatchPublicResponse) {
    const toast = useToast();
    const registerGoal = useRegisterGoal();
    const registerCard = useRegisterCard();
    const pauseClock = usePauseClock();
    const resumeClock = useResumeClock();
    const startPeriod = useStartPeriod();
    const endPeriod = useEndPeriod();
    const endSet = useEndSet();
    const finishMatch = useFinishMatch();
    const startPenaltyShootout = useStartPenaltyShootout();
    const registerPenaltyKick = useRegisterPenaltyKick();
    const endPenaltyShootout = useEndPenaltyShootout();
    const undoLastEvent = useUndoLastMatchEvent();

    const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState(match.team1.team_id);
    const finishSheetRef = useRef<BottomSheetHandle>(null);

    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    const run = async (action: () => Promise<unknown>, successMessage: string | undefined, fallbackError: string) => {
        try {
            await action();
            if (successMessage) toast.success(successMessage);
        } catch (error) {
            toast.error(friendlyErrorMessage(error, fallbackError));
        }
    };

    const isVolleyball = match.modality_configuration?.score_type === 'SETS';
    const pointLabel = match.modality_configuration?.score_type === 'GOALS' ? 'Gol' : 'Ponto';

    const confirmEndPeriod = () => setPendingAction('endPeriod');
    const confirmEndSet = () => setPendingAction('endSet');
    const confirmEndPenaltyShootout = () => setPendingAction('endPenaltyShootout');
    const confirmStartPenaltyShootout = () => setPendingAction('startPenaltyShootout');

    const pendingActionBusy =
        endPeriod.isPending || endSet.isPending || endPenaltyShootout.isPending || startPenaltyShootout.isPending;

    const handlePendingActionConfirm = () => {
        if (pendingAction === 'endPeriod') {
            run(
                () => endPeriod.mutateAsync({ matchId: match.match_id }),
                'Período encerrado.',
                'Não foi possível encerrar o período.'
            ).finally(() => setPendingAction(null));
        } else if (pendingAction === 'endSet') {
            run(() => endSet.mutateAsync({ matchId: match.match_id }), 'Set encerrado.', 'Não foi possível encerrar o set.').finally(
                () => setPendingAction(null)
            );
        } else if (pendingAction === 'endPenaltyShootout') {
            run(
                () => endPenaltyShootout.mutateAsync({ matchId: match.match_id }),
                'Disputa de pênaltis encerrada.',
                'Não foi possível encerrar a disputa de pênaltis.'
            ).finally(() => setPendingAction(null));
        } else if (pendingAction === 'startPenaltyShootout') {
            run(
                () => startPenaltyShootout.mutateAsync({ matchId: match.match_id }),
                'Disputa de pênaltis iniciada.',
                'Não foi possível iniciar a disputa de pênaltis.'
            ).finally(() => setPendingAction(null));
        }
    };

    const handleUndo = async () => {
        try {
            await undoLastEvent.mutateAsync({ matchId: match.match_id });
            setUndoConfirmOpen(false);
            toast.success('Último evento desfeito.');
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível desfazer o evento.'));
        }
    };

    const handleFinish = async () => {
        try {
            await finishMatch.mutateAsync({ matchId: match.match_id });
            finishSheetRef.current?.dismiss();
            toast.success('Partida finalizada.');
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível finalizar a partida.'));
        }
    };

    const undoDialog = undoPreview(match);

    const pendingActionCopy: Record<Exclude<PendingAction, null>, { title: string; description: string }> = {
        endPeriod: { title: 'Fim do tempo?', description: `Finalizar o ${match.current_period}º período.` },
        endSet: { title: 'Encerrar set?', description: 'O set atual será registrado no histórico da partida.' },
        endPenaltyShootout: {
            title: 'Encerrar disputa de pênaltis?',
            description: 'A disputa será encerrada com o placar atual.',
        },
        startPenaltyShootout: {
            title: 'Iniciar disputa de pênaltis?',
            description: 'A partida está empatada e vai para a disputa de pênaltis.',
        },
    };

    return {
        registerGoal,
        registerCard,
        pauseClock,
        resumeClock,
        startPeriod,
        endPeriod,
        endSet,
        finishMatch,
        startPenaltyShootout,
        registerPenaltyKick,
        endPenaltyShootout,
        undoLastEvent,
        undoConfirmOpen,
        setUndoConfirmOpen,
        selectedTeamId,
        setSelectedTeamId,
        finishSheetRef,
        pendingAction,
        setPendingAction,
        run,
        isVolleyball,
        pointLabel,
        confirmEndPeriod,
        confirmEndSet,
        confirmEndPenaltyShootout,
        confirmStartPenaltyShootout,
        pendingActionBusy,
        handlePendingActionConfirm,
        handleUndo,
        handleFinish,
        undoDialog,
        pendingActionCopy,
    };
}
