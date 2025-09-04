export class BoardPlayLocation {
    unoccupiedTiles: number[]; // The tiles that need to have cards played on them to form a hand
    occupiedTiles: number[]; // The anchoring tiles on the board that already have cards on them from previous play

    constructor(unoccupiedTiles: number[] = [], occupiedTiles: number[] = []) {
        this.unoccupiedTiles = unoccupiedTiles;
        this.occupiedTiles = occupiedTiles;
    }
}

export enum Direction {
    None = -1,
    Horizontal,
    Vertical
}

export class BoardHelpers {
    public static readonly BOARD_DIMENSION = 13;
    public static readonly HAND_SIZE = 5;

    public static findValidPlacementTilesForFirstCardOfHand(board: boolean[], blockedCells: boolean[]): number[] {
        return BoardHelpers.findValidPlacementTilesForFirstCardOfHandWithLimit(board, blockedCells, Number.MAX_SAFE_INTEGER);
    }

    public static findValidPlacementTilesForFirstCardOfHandWithLimit(board: boolean[], blockedCells: boolean[], limit: number): number[] {
        const results: number[] = [];

        for (let yIndex = 0; yIndex < this.BOARD_DIMENSION; ++yIndex) {
            for (let xIndex = 0; xIndex < this.BOARD_DIMENSION; ++xIndex) {
                const currentIndex = this._getTileIndexFromCoordinates(xIndex, yIndex, this.BOARD_DIMENSION);

                if (board[currentIndex]) {
                    for (let i = 0; i < this.HAND_SIZE; i++) {
                        if (this.canPlaceCards(board, blockedCells, xIndex - i, yIndex, Direction.Horizontal, limit)) {
                            if (i === 0) {
                                results.push(currentIndex + 1);
                            } else if (i === 4) {
                                results.push(currentIndex - 1);
                            } else {
                                results.push(currentIndex - 1);
                                results.push(currentIndex + 1);
                            }
                        }

                        if (this.canPlaceCards(board, blockedCells, xIndex, yIndex - i, Direction.Vertical, limit)) {
                            if (i === 0) {
                                results.push(currentIndex + this.BOARD_DIMENSION);
                            } else if (i === 4) {
                                results.push(currentIndex - this.BOARD_DIMENSION);
                            } else {
                                results.push(currentIndex - this.BOARD_DIMENSION);
                                results.push(currentIndex + this.BOARD_DIMENSION);
                            }
                        }
                    }
                }
            }
        }

        return Array.from(new Set(results)); // Ensuring unique values in results
    }

    public static findValidPlacementTilesAfterHavingAlreadyPlacedSomeCards(
        board: boolean[],
        blockedCells: boolean[],
        workingTilePosition: { x: number; y: number },
        direction: Direction,
        limit: number
    ): number[] {
        const results: number[] = [];

        const addToResultsIfNotOccupied = (x: number, y: number) => {
            const tileIndexFromCoordinates = this._getTileIndexFromCoordinates(x, y, this.BOARD_DIMENSION);
            if (!board[tileIndexFromCoordinates]) {
                results.push(tileIndexFromCoordinates);
            }
        };

        for (let i = 0; i < this.HAND_SIZE; i++) {
            switch (direction) {
                case Direction.Horizontal:
                    if (this.canPlaceCards(board, blockedCells, workingTilePosition.x - i, workingTilePosition.y, Direction.Horizontal, limit)) {
                        if (i === 0) {
                            addToResultsIfNotOccupied(workingTilePosition.x + 1, workingTilePosition.y);
                        } else if (i === 4) {
                            addToResultsIfNotOccupied(workingTilePosition.x - 1, workingTilePosition.y);
                        } else {
                            addToResultsIfNotOccupied(workingTilePosition.x - 1, workingTilePosition.y);
                            addToResultsIfNotOccupied(workingTilePosition.x + 1, workingTilePosition.y);
                        }
                    }
                    break;
                case Direction.Vertical:
                    if (this.canPlaceCards(board, blockedCells, workingTilePosition.x, workingTilePosition.y - i, Direction.Vertical, limit)) {
                        if (i === 0) {
                            addToResultsIfNotOccupied(workingTilePosition.x, workingTilePosition.y + 1);
                        } else if (i === 4) {
                            addToResultsIfNotOccupied(workingTilePosition.x, workingTilePosition.y - 1);
                        } else {
                            addToResultsIfNotOccupied(workingTilePosition.x, workingTilePosition.y - 1);
                            addToResultsIfNotOccupied(workingTilePosition.x, workingTilePosition.y + 1);
                        }
                    }
                    break;
            }
        }

        return results;
    }

    public static findValidPlayLocations(board: boolean[], blockedCells: boolean[], limit: number): BoardPlayLocation[] {
        const results: BoardPlayLocation[] = [];
        const unoccupied = Array(this.HAND_SIZE).fill(-1);
        const occupied = Array(this.HAND_SIZE).fill(-1);

        for (let yIndex = 0; yIndex < this.BOARD_DIMENSION; ++yIndex) {
            for (let xIndex = 0; xIndex < this.BOARD_DIMENSION; ++xIndex) {
                const currentIndex = this._getTileIndexFromCoordinates(xIndex, yIndex, this.BOARD_DIMENSION);

                if (board[currentIndex]) {
                    for (let i = 0; i < this.HAND_SIZE; i++) {
                        unoccupied.fill(-1);
                        occupied.fill(-1);

                        if (this.canPlaceCards(board, blockedCells, xIndex - i, yIndex, Direction.Horizontal, limit, unoccupied, occupied)) {
                            results.push(this._createBoardPlayLocation(currentIndex, unoccupied, occupied));
                        }

                        unoccupied.fill(-1);
                        occupied.fill(-1);

                        if (this.canPlaceCards(board, blockedCells, xIndex, yIndex - i, Direction.Vertical, limit, unoccupied, occupied)) {
                            results.push(this._createBoardPlayLocation(currentIndex, unoccupied, occupied));
                        }
                    }
                }
            }
        }

        return results;
    }

    public static canPlaceCards(
        board: boolean[],
        blockedCells: boolean[],
        xCoord: number,
        yCoord: number,
        direction: Direction,
        limit: number,
        unoccupiedIndices?: number[],
        occupiedIndices?: number[]
    ): boolean {
        let xOffset = 0;
        let yOffset = 0;

        switch (direction) {
            case Direction.Horizontal:
                xOffset = 1;
                break;
            case Direction.Vertical:
                yOffset = 1;
                break;
        }

        let nOccupied = 0;
        let nUnoccupied = 0;

        for (let i = 0; i < this.HAND_SIZE; i++) {
            const currentXCoord = xCoord + xOffset * i;
            const currentYCoord = yCoord + yOffset * i;

            if (currentXCoord < 0 || currentYCoord < 0 || currentXCoord >= this.BOARD_DIMENSION || currentYCoord >= this.BOARD_DIMENSION) {
                return false;
            }

            if (this.isBlocked(blockedCells, currentXCoord, currentYCoord)) {
                return false;
            }

            if (i === 0 && this.isOccupied(board, currentXCoord - xOffset, currentYCoord - yOffset)) {
                return false;
            }

            if (i === this.HAND_SIZE - 1 && this.isOccupied(board, currentXCoord + xOffset, currentYCoord + yOffset)) {
                return false;
            }

            if (this.isOccupied(board, currentXCoord, currentYCoord)) {
                if (occupiedIndices) {
                    occupiedIndices[nOccupied] = this._getTileIndexFromCoordinates(currentXCoord, currentYCoord, this.BOARD_DIMENSION);
                }
                nOccupied++;
                continue;
            }

            if (
                this.isOccupied(board, currentXCoord + yOffset, currentYCoord + xOffset) ||
                this.isOccupied(board, currentXCoord - yOffset, currentYCoord - xOffset)
            ) {
                return false;
            }

            if (unoccupiedIndices) {
                unoccupiedIndices[nUnoccupied] = this._getTileIndexFromCoordinates(currentXCoord, currentYCoord, this.BOARD_DIMENSION);
            }
            nUnoccupied++;
        }

        return nOccupied > 0 && nUnoccupied > 0 && nUnoccupied <= limit;
    }

    public static isOccupied(board: boolean[], xCoord: number, yCoord: number): boolean {
        if (xCoord < 0 || xCoord >= this.BOARD_DIMENSION || yCoord < 0 || yCoord >= this.BOARD_DIMENSION) {
            return false;
        }
        return board[this._getTileIndexFromCoordinates(xCoord, yCoord, this.BOARD_DIMENSION)];
    }

    public static isBlocked(blockedCells: boolean[], xCoord: number, yCoord: number): boolean {
        if (xCoord < 0 || xCoord >= this.BOARD_DIMENSION || yCoord < 0 || yCoord >= this.BOARD_DIMENSION) {
            return false;
        }
        return blockedCells[this._getTileIndexFromCoordinates(xCoord, yCoord, this.BOARD_DIMENSION)];
    }

    private static _getTileIndexFromCoordinates = (x: number, y: number, dimensions: number): number => x + dimensions * y;

    private static _createBoardPlayLocation(currentIndex: number, unoccupied: number[], occupied: number[]): BoardPlayLocation {
        const unoccupiedList = unoccupied.filter((idx) => idx !== -1).sort((a, b) => Math.abs(a - currentIndex));
        const occupiedList = occupied.filter((idx) => idx !== -1);
        return new BoardPlayLocation(unoccupiedList, occupiedList);
    }
}
