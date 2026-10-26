export interface ForgeGame {
  siteId?: string;
  brandId?: number;
  gameId: string;
  title?: string;
  provider?: string;

  info?:
    | string
    | {
        rtp?: number;
        standardDeviation?: number;
      }
    | null;
}

export interface ForgeGamesResponse {
  totalCount: number;
  items: ForgeGame[];
}

export interface ForgeOperator {
  id: number;
  siteId: string;
  brandIds?: number[];
  name?: string;
}

export interface ForgeOperatorsResponse {
  totalCount: number;
  items: ForgeOperator[];
}

export interface SyncResult {
  total_inserted: number;
  total_updated: number;
  total_skipped: number;
}
