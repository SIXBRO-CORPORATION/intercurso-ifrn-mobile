const CAMPUS_OFFSET_MINUTES = -180;
const CAMPUS_OFFSET_ISO = '-03:00';

export type RelativeDay = 'yesterday' | 'today' | 'tomorrow';

const DAY_DELTA: Record<RelativeDay, number> = {
    yesterday: -1,
    today: 0,
    tomorrow: 1,
};

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

function toCampusWallClock(date: Date): Date {
    return new Date(date.getTime() + CAMPUS_OFFSET_MINUTES * 60_000);
}

function formatIsoAtCampus(year: number, month: number, day: number, time: string, ms: number): string {
    return `${year}-${pad(month + 1)}-${pad(day)}T${time}.${pad(ms, 3)}${CAMPUS_OFFSET_ISO}`;
}

export function getCampusDayRange(day: RelativeDay, now: Date = new Date()): { dateFrom: string; dateTo: string } {
    const wall = toCampusWallClock(now);
    const target = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + DAY_DELTA[day]));

    const year = target.getUTCFullYear();
    const month = target.getUTCMonth();
    const date = target.getUTCDate();

    return {
        dateFrom: formatIsoAtCampus(year, month, date, '00:00:00', 0),
        dateTo: formatIsoAtCampus(year, month, date, '23:59:59', 999),
    };
}

export function formatCampusTime(isoDate: string): string {
    const wall = toCampusWallClock(new Date(isoDate));
    return `${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`;
}

export function formatCampusShortDate(isoDate: string): string {
    const wall = toCampusWallClock(new Date(isoDate));
    return `${pad(wall.getUTCDate())}/${pad(wall.getUTCMonth() + 1)}`;
}

export function formatMatchClock(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds));
    return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}
