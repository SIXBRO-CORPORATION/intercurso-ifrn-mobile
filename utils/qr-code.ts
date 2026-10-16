// Encoder de QR Code (modo byte, nível de correção L, versões 1 a 6) escrito
// a partir do zero para esta tela, sem depender de nenhuma lib de QR — a
// Fase 1 do plano de refatoração já fechou a lista de dependências novas e
// não incluiu uma. Implementa só o necessário para o link de convite
// (ver `buildInviteLink` em `utils/team-invite.ts`): algoritmo ISO/IEC 18004
// (Reed-Solomon sobre GF(256), máscara de menor penalidade, bits de formato).
//
// Versões 7+ exigem os bits de "version info" (BCH 18,6) nos cantos, que este
// encoder não implementa de propósito — não são necessários aqui porque os
// links reais do app (ver `buildInviteLink`) ficam bem abaixo da capacidade da
// versão 6 (~130 bytes). Se o texto não couber, `encodeQrMatrix` retorna
// `null` e quem chama deve tratar a ausência do QR (ex.: mostrar só o link).

type Bit = 0 | 1;

// --- GF(256), polinômio primitivo 0x11D (padrão do Reed-Solomon do QR) -----

const GF_EXP = new Array<number>(512);
const GF_LOG = new Array<number>(256);

(function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function generatorPolynomial(degree: number): number[] {
    let g = [1];
    for (let i = 0; i < degree; i++) {
        const factor = [1, GF_EXP[i]];
        const next = new Array(g.length + 1).fill(0);
        for (let a = 0; a < g.length; a++) {
            for (let b = 0; b < factor.length; b++) {
                next[a + b] ^= gfMul(g[a], factor[b]);
            }
        }
        g = next;
    }
    return g;
}

function reedSolomonEncode(dataCodewords: number[], ecCount: number): number[] {
    const generator = generatorPolynomial(ecCount);
    const buffer = dataCodewords.concat(new Array(ecCount).fill(0));
    for (let i = 0; i < dataCodewords.length; i++) {
        const coef = buffer[i];
        if (coef !== 0) {
            for (let j = 0; j < generator.length; j++) {
                buffer[i + j] ^= gfMul(generator[j], coef);
            }
        }
    }
    return buffer.slice(dataCodewords.length);
}

// --- Estrutura de blocos (ECC nível L, versões 1–6) -------------------------
// Fonte: tabela de blocos Reed-Solomon do ISO/IEC 18004 (Annex D / tabela de
// correção de erros) — valores padronizados da especificação, conferidos
// bit a bit contra uma implementação de referência antes de entrar aqui.

interface RsBlockSpec {
    ec: number;
    group1Blocks: number;
    group1DataCodewords: number;
    group2Blocks: number;
    group2DataCodewords: number;
}

const RS_BLOCKS_LEVEL_L: Record<number, RsBlockSpec> = {
    1: { ec: 7, group1Blocks: 1, group1DataCodewords: 19, group2Blocks: 0, group2DataCodewords: 0 },
    2: { ec: 10, group1Blocks: 1, group1DataCodewords: 34, group2Blocks: 0, group2DataCodewords: 0 },
    3: { ec: 15, group1Blocks: 1, group1DataCodewords: 55, group2Blocks: 0, group2DataCodewords: 0 },
    4: { ec: 20, group1Blocks: 1, group1DataCodewords: 80, group2Blocks: 0, group2DataCodewords: 0 },
    5: { ec: 26, group1Blocks: 1, group1DataCodewords: 108, group2Blocks: 0, group2DataCodewords: 0 },
    6: { ec: 18, group1Blocks: 2, group1DataCodewords: 68, group2Blocks: 0, group2DataCodewords: 0 },
};

const MAX_SUPPORTED_VERSION = 6;

function dataCapacityCodewords(version: number): number {
    const b = RS_BLOCKS_LEVEL_L[version];
    return b.group1Blocks * b.group1DataCodewords + b.group2Blocks * b.group2DataCodewords;
}

function pickVersion(byteLength: number): number | null {
    for (let version = 1; version <= MAX_SUPPORTED_VERSION; version++) {
        const capacityBits = dataCapacityCodewords(version) * 8;
        const requiredBits = 4 + 8 + byteLength * 8; // modo(4) + contador(8, v<=9) + dados
        if (requiredBits <= capacityBits) return version;
    }
    return null;
}

// --- Montagem dos codewords de dados (modo byte) ----------------------------

function encodeDataCodewords(bytes: number[], version: number): number[] {
    const bits: Bit[] = [];
    const pushBits = (value: number, length: number) => {
        for (let i = length - 1; i >= 0; i--) bits.push(((value >> i) & 1) as Bit);
    };

    pushBits(0b0100, 4); // indicador de modo: byte
    pushBits(bytes.length, 8); // contador de caracteres (8 bits até a versão 9)
    for (const byte of bytes) pushBits(byte, 8);

    const capacityBits = dataCapacityCodewords(version) * 8;
    const terminatorLength = Math.min(4, Math.max(0, capacityBits - bits.length));
    for (let i = 0; i < terminatorLength; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const padBytes = [0xec, 0x11];
    let padIndex = 0;
    while (bits.length < capacityBits) {
        pushBits(padBytes[padIndex % 2], 8);
        padIndex++;
    }

    const codewords: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        let value = 0;
        for (let j = 0; j < 8; j++) value = (value << 1) | bits[i + j];
        codewords.push(value);
    }
    return codewords;
}

function interleaveWithErrorCorrection(dataCodewords: number[], version: number): number[] {
    const spec = RS_BLOCKS_LEVEL_L[version];
    const blocks: number[][] = [];
    let offset = 0;
    for (let i = 0; i < spec.group1Blocks; i++) {
        blocks.push(dataCodewords.slice(offset, offset + spec.group1DataCodewords));
        offset += spec.group1DataCodewords;
    }
    for (let i = 0; i < spec.group2Blocks; i++) {
        blocks.push(dataCodewords.slice(offset, offset + spec.group2DataCodewords));
        offset += spec.group2DataCodewords;
    }
    const ecBlocks = blocks.map((block) => reedSolomonEncode(block, spec.ec));

    const interleavedData: number[] = [];
    const maxDataLen = Math.max(...blocks.map((b) => b.length));
    for (let i = 0; i < maxDataLen; i++) {
        for (const block of blocks) if (i < block.length) interleavedData.push(block[i]);
    }

    const interleavedEc: number[] = [];
    const maxEcLen = Math.max(...ecBlocks.map((b) => b.length));
    for (let i = 0; i < maxEcLen; i++) {
        for (const block of ecBlocks) if (i < block.length) interleavedEc.push(block[i]);
    }

    return interleavedData.concat(interleavedEc);
}

// Bits de preenchimento ("remainder bits") por versão — parte da especificação.
const REMAINDER_BITS: Record<number, number> = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7 };

function codewordsToBitStream(codewords: number[], version: number): Bit[] {
    const bits: Bit[] = [];
    for (const codeword of codewords) {
        for (let i = 7; i >= 0; i--) bits.push(((codeword >> i) & 1) as Bit);
    }
    for (let i = 0; i < REMAINDER_BITS[version]; i++) bits.push(0);
    return bits;
}

// --- Montagem da matriz -----------------------------------------------------

type Cell = Bit | null | -1; // -1 marca área reservada (info de formato)

function moduleCountForVersion(version: number): number {
    return version * 4 + 17;
}

function placeFinderPattern(matrix: Cell[][], row: number, col: number) {
    const size = matrix.length;
    for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
            const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
            const isOuterRing = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
            const isInnerBox = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[rr][cc] = isBorder ? 0 : isOuterRing || isInnerBox ? 1 : 0;
        }
    }
}

function placeTimingPatterns(matrix: Cell[][]) {
    const size = matrix.length;
    for (let i = 8; i < size - 8; i++) {
        const value: Bit = i % 2 === 0 ? 1 : 0;
        if (matrix[6][i] === null) matrix[6][i] = value;
        if (matrix[i][6] === null) matrix[i][6] = value;
    }
}

function placeAlignmentPattern(matrix: Cell[][], version: number) {
    if (version === 1) return;
    const size = matrix.length;
    const centers = [6, version * 4 + 10];
    for (const row of centers) {
        for (const col of centers) {
            const overlapsFinder =
                (row === 6 && col === 6) || (row === 6 && col === size - 7) || (row === size - 7 && col === 6);
            if (overlapsFinder) continue;
            for (let r = -2; r <= 2; r++) {
                for (let c = -2; c <= 2; c++) {
                    const isRing = Math.max(Math.abs(r), Math.abs(c)) === 2;
                    matrix[row + r][col + c] = isRing || (r === 0 && c === 0) ? 1 : 0;
                }
            }
        }
    }
}

function reserveFormatInfoAreas(matrix: Cell[][]) {
    const size = matrix.length;
    for (let i = 0; i < 9; i++) {
        if (matrix[8][i] === null) matrix[8][i] = -1;
        if (matrix[i][8] === null) matrix[i][8] = -1;
    }
    for (let i = 0; i < 8; i++) {
        if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = -1;
        if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = -1;
    }
}

function placeData(matrix: Cell[][], bits: Bit[]) {
    const size = matrix.length;
    let bitIndex = 0;
    let col = size - 1;
    let upward = true;
    while (col > 0) {
        if (col === 6) col--; // coluna de timing fica de fora da varredura
        for (let i = 0; i < size; i++) {
            const row = upward ? size - 1 - i : i;
            for (const c of [col, col - 1]) {
                if (matrix[row][c] === null) {
                    matrix[row][c] = bitIndex < bits.length ? bits[bitIndex] : 0;
                    bitIndex++;
                }
            }
        }
        upward = !upward;
        col -= 2;
    }
}

type MaskFn = (row: number, col: number) => boolean;

const MASK_FUNCTIONS: MaskFn[] = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(matrix: Cell[][], reserved: boolean[][], maskFn: MaskFn): Cell[][] {
    return matrix.map((row, r) =>
        row.map((value, c) => {
            if (reserved[r][c] || value === null) return value;
            return maskFn(r, c) ? ((Number(value) ^ 1) as Bit) : value;
        })
    );
}

function maskPenalty(matrix: Cell[][]): number {
    const size = matrix.length;
    const v = (r: number, c: number) => (matrix[r][c] === -1 ? 0 : (matrix[r][c] as number));
    let total = 0;

    for (let r = 0; r < size; r++) {
        let run = 1;
        for (let c = 1; c < size; c++) {
            if (v(r, c) === v(r, c - 1)) run++;
            else {
                if (run >= 5) total += 3 + (run - 5);
                run = 1;
            }
        }
        if (run >= 5) total += 3 + (run - 5);
    }
    for (let c = 0; c < size; c++) {
        let run = 1;
        for (let r = 1; r < size; r++) {
            if (v(r, c) === v(r - 1, c)) run++;
            else {
                if (run >= 5) total += 3 + (run - 5);
                run = 1;
            }
        }
        if (run >= 5) total += 3 + (run - 5);
    }

    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const value = v(r, c);
            if (value === v(r, c + 1) && value === v(r + 1, c) && value === v(r + 1, c + 1)) total += 3;
        }
    }

    const finderLike = [
        [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
    ];
    const matchesAt = (getAt: (i: number) => number, start: number, pattern: number[]) =>
        pattern.every((bit, k) => getAt(start + k) === bit);
    for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size - 11; c++) {
            for (const pattern of finderLike) {
                if (matchesAt((i) => v(r, i), c, pattern)) total += 40;
            }
        }
    }
    for (let c = 0; c < size; c++) {
        for (let r = 0; r <= size - 11; r++) {
            for (const pattern of finderLike) {
                if (matchesAt((i) => v(i, c), r, pattern)) total += 40;
            }
        }
    }

    let dark = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (v(r, c)) dark++;
    const percentDark = (dark * 100) / (size * size);
    const prevMultiple = Math.floor(percentDark / 5) * 5;
    const nextMultiple = prevMultiple + 5;
    total += Math.min(Math.abs(prevMultiple - 50), Math.abs(nextMultiple - 50)) * 2;

    return total;
}

const FORMAT_GENERATOR = 0x537; // polinômio gerador BCH(15,5) da info de formato
const FORMAT_MASK = 0x5412; // máscara fixa da especificação
const ECC_LEVEL_L_BITS = 0b01;

function formatInfoBits(maskIndex: number): Bit[] {
    const data = (ECC_LEVEL_L_BITS << 3) | maskIndex;
    let remainder = data << 10;
    for (let i = 14; i >= 10; i--) {
        if ((remainder >> i) & 1) remainder ^= FORMAT_GENERATOR << (i - 10);
    }
    const combined = ((data << 10) | remainder) ^ FORMAT_MASK;
    const bits: Bit[] = [];
    for (let i = 14; i >= 0; i--) bits.push(((combined >> i) & 1) as Bit);
    return bits;
}

function placeFormatInfo(matrix: Cell[][], maskIndex: number) {
    const size = matrix.length;
    const bits = formatInfoBits(maskIndex);
    const topLeftCols = [0, 1, 2, 3, 4, 5, 7, 8];
    topLeftCols.forEach((col, i) => (matrix[8][col] = bits[i]));
    matrix[7][8] = bits[8];
    for (let i = 9; i < 15; i++) matrix[14 - i][8] = bits[i];
    for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = bits[i];
    for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = bits[i];
}

/**
 * Gera a matriz booleana (true = módulo escuro) de um QR Code para `text`,
 * usando o menor tamanho de versão (1 a 6) que couber, nível de correção L.
 * Retorna `null` se o texto não couber em nenhuma versão suportada — quem
 * chama deve tratar isso (ex.: não mostrar o QR, só o link).
 */
export function encodeQrMatrix(text: string): boolean[][] | null {
    const bytes = Array.from(new TextEncoder().encode(text));
    const version = pickVersion(bytes.length);
    if (!version) return null;

    const dataCodewords = encodeDataCodewords(bytes, version);
    const allCodewords = interleaveWithErrorCorrection(dataCodewords, version);
    const bits = codewordsToBitStream(allCodewords, version);

    const size = moduleCountForVersion(version);
    const matrix: Cell[][] = Array.from({ length: size }, () => new Array<Cell>(size).fill(null));

    placeFinderPattern(matrix, 0, 0);
    placeFinderPattern(matrix, 0, size - 7);
    placeFinderPattern(matrix, size - 7, 0);
    placeTimingPatterns(matrix);
    placeAlignmentPattern(matrix, version);
    matrix[4 * version + 9][8] = 1; // módulo escuro fixo
    reserveFormatInfoAreas(matrix);

    const reserved = matrix.map((row) => row.map((cell) => cell !== null));
    placeData(matrix, bits);

    let best: Cell[][] | null = null;
    let bestPenalty = Infinity;
    for (let maskIndex = 0; maskIndex < MASK_FUNCTIONS.length; maskIndex++) {
        const masked = applyMask(matrix, reserved, MASK_FUNCTIONS[maskIndex]);
        placeFormatInfo(masked, maskIndex);
        const penalty = maskPenalty(masked);
        if (penalty < bestPenalty) {
            bestPenalty = penalty;
            best = masked;
        }
    }

    return best!.map((row) => row.map((cell) => cell === 1));
}
