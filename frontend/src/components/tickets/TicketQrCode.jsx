import React, { useMemo } from 'react';
import './TicketQrCode.css';

const QR_SIZE = 21;

const isFinderCell = (row, col, originRow, originCol) => {
    const localRow = row - originRow;
    const localCol = col - originCol;
    if (localRow < 0 || localRow > 6 || localCol < 0 || localCol > 6) {
        return false;
    }

    const outer = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
    const inner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
    return outer || inner;
};

const buildMatrix = (value) => {
    let seed = 0;
    for (let index = 0; index < value.length; index += 1) {
        seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
    }

    const nextBit = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed >>> 30) & 1;
    };

    const matrix = [];

    for (let row = 0; row < QR_SIZE; row += 1) {
        const cells = [];
        for (let col = 0; col < QR_SIZE; col += 1) {
            const inTopLeft = isFinderCell(row, col, 0, 0);
            const inTopRight = isFinderCell(row, col, 0, QR_SIZE - 7);
            const inBottomLeft = isFinderCell(row, col, QR_SIZE - 7, 0);

            if (inTopLeft || inTopRight || inBottomLeft) {
                cells.push(true);
                continue;
            }

            if (row === 6 || col === 6) {
                cells.push((row + col) % 2 === 0);
                continue;
            }

            cells.push(nextBit() === 1);
        }
        matrix.push(cells);
    }

    return matrix;
};

const TicketQrCode = ({ value, title = 'Mã QR vé' }) => {
    const matrix = useMemo(() => buildMatrix(value || 'EMPTY_QR'), [value]);

    return (
        <div className="ticket-qr-card">
            <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className="ticket-qr-svg" aria-label={title} role="img">
                <rect width={QR_SIZE} height={QR_SIZE} fill="#ffffff" rx="1.2" />
                {matrix.map((row, rowIndex) => (
                    row.map((filled, colIndex) => (
                        filled ? (
                            <rect
                                key={`${rowIndex}-${colIndex}`}
                                x={colIndex}
                                y={rowIndex}
                                width="1"
                                height="1"
                                fill="#111111"
                            />
                        ) : null
                    ))
                ))}
            </svg>
            <div className="ticket-qr-label">{title}</div>
            <div className="ticket-qr-value">{value}</div>
        </div>
    );
};

export default TicketQrCode;
