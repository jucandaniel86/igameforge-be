export type ReportFieldHelpKey = keyof typeof REPORT_FIELD_HELP;

export type ReportFieldHelpConfig = {
  title: string;
  formula: string;
  nativeCurrency: string;
  description: string;
};

export const REPORT_FIELD_HELP = {
  "summary.ggr": {
    title: "GGR",
    formula: "Total wagered - Total payouts - Total refunds",
    nativeCurrency: "EUR",
    description:
      "Gross Gaming Revenue calculated from the monetary values displayed in the Summary report.",
  },
  "summary.currency": {
    title: "Transaction Currency",
    formula: "Currency of the transaction | currency",
    nativeCurrency: "",
    description: "Currency of the transaction in the Summary report.",
  },
  "summary.brand_id": {
    title: "Brand Name",
    formula: "Name of the brand associated with the brand_id field | brand_id",
    nativeCurrency: "",
    description: "Brand associated with the brand_id field in the Summary report.",
  },
  "summary.avg_bets": {
    title: "AVG Bets",
    formula: "Total wagered / Total bets",
    nativeCurrency: "EUR",
    description:
      "Average bet amount calculated from the monetary values displayed in the Summary report.",
  },
  "summary.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Summary report.",
  },
  "summary.rtp": {
    title: "RTP",
    formula: "Total payouts / Total wagered * 100",
    nativeCurrency: "EUR",
    description:
      "Return to Player percentage calculated from the monetary values displayed in the Summary report.",
  },
  "summary.total_refunds": {
    title: "Total Refunds",
    formula: "Sum of all refunds issued | SUM(refund)",
    nativeCurrency: "EUR",
    description: "Total amount of refunds issued in the Summary report.",
  },
  "summary.total_win_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Summary report.",
  },
  "summary.total_players": {
    title: "Total Players",
    formula: "Count of unique players | COUNT(DISTINCT operator_player_id)",
    nativeCurrency: "",
    description: "Total number of players in the Summary report.",
  },
  "summary.total_games": {
    title: "Total Games",
    formula: "Count of unique games | COUNT(DISTINCT game_id)",
    nativeCurrency: "",
    description: "Total number of games in the Summary report.",
  },
  "summary.total_sessions": {
    title: "Total Sessions",
    formula: "Count of unique sessions | COUNT(DISTINCT session_id)",
    nativeCurrency: "",
    description: "Total number of sessions in the Summary report.",
  },
  "summary.total_spins": {
    title: "Total Spins",
    formula: "Count of all spins | COUNT( CASE WHEN round_complete THEN 1 ELSE NULL END)",
    nativeCurrency: "",
    description: "Total number of spins in the Summary report.",
  },
  "summary.site_id": {
    title: "Client ID (Operator)",
    formula: "Name of the client associated with the site_id field | site_id",
    nativeCurrency: "",
    description: "Client ID (Operator) associated with the site_id field in the Summary report.",
  },
  "summary.total_brands": {
    title: "Brands",
    formula: "Count of unique brands | COUNT(DISTINCT brand_id)",
    nativeCurrency: "",
    description: "Total number of brands in the Summary report.",
  },

  //Brands report field helps
  "brands.brand_id": {
    title: "Brand",
    formula: "Name of the brand associated with the brand_id field | brand_id",
    nativeCurrency: "EUR",
    description: "Brand associated with the brand_id field in the Brands report.",
  },
  "brands.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Brands report.",
  },
  "brands.total_win_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Brands report.",
  },
  "brands.total_refunds": {
    title: "Total Refunds",
    formula: "Sum of all refunds issued | SUM(refund)",
    nativeCurrency: "EUR",
    description: "Total amount of refunds issued in the Brands report.",
  },
  "brands.ggr": {
    title: "GGR",
    formula: "Total wagered - Total payouts - Total refunds",
    nativeCurrency: "EUR",
    description:
      "Gross Gaming Revenue calculated from the monetary values displayed in the Brands report.",
  },
  "brands.rtp": {
    title: "RTP",
    formula: "Total payouts / Total wagered * 100",
    nativeCurrency: "EUR",
    description:
      "Return to Player percentage calculated from the monetary values displayed in the Brands report.",
  },
  "brands.avg_bets": {
    title: "AVG Bets",
    formula: "Total wagered / Total bets",
    nativeCurrency: "EUR",
    description:
      "Average bet amount calculated from the monetary values displayed in the Brands report.",
  },
  "brands.total_games": {
    title: "Total Games",
    formula: "Count of unique games | COUNT(DISTINCT game_id)",
    nativeCurrency: "",
    description: "Total number of games in the Brands report.",
  },
  "brands.total_sessions": {
    title: "Total Sessions",
    formula: "Count of unique sessions | COUNT(DISTINCT session_id)",
    nativeCurrency: "",
    description: "Total number of sessions in the Brands report.",
  },
  "brands.total_spins": {
    title: "Total Spins",
    formula: "Count of all spins | COUNT( CASE WHEN round_complete THEN 1 ELSE NULL END)",
    nativeCurrency: "",
    description: "Total number of spins in the Brands report.",
  },
  "brands.total_players": {
    title: "Total Players",
    formula: "Count of unique players | COUNT(DISTINCT operator_player_id)",
    nativeCurrency: "",
    description: "Total number of players in the Brands report.",
  },

  //Players report field helps
  "players.operator_player_id": {
    title: "Player ID",
    formula:
      "Unique identifier of the player associated with the operator_player_id field | operator_player_id",
    nativeCurrency: "",
    description:
      "Unique identifier of the player associated with the operator_player_id field in the Players report.",
  },
  "players.client_name": {
    title: "Client Name",
    formula: "Name of the client associated with the client_name field | site_id",
    nativeCurrency: "",
    description: "Name of the client associated with the client_name field in the Players report.",
  },
  "players.brand": {
    title: "Brand",
    formula: "Name of the brand associated with the brand_id field | brand_id",
    nativeCurrency: "EUR",
    description: "Brand associated with the brand_id field in the Players report.",
  },
  "players.total_wins_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Players report.",
  },
  "players.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Players report.",
  },
  "players.total_refunds": {
    title: "Total Refunds",
    formula: "Sum of all refunds issued | SUM(refund)",
    nativeCurrency: "EUR",
    description: "Total amount of refunds issued in the Players report.",
  },
  "players.ggr": {
    title: "GGR",
    formula: "Total wagered - Total payouts - Total refunds",
    nativeCurrency: "EUR",
    description:
      "Gross Gaming Revenue calculated from the monetary values displayed in the Players report.",
  },
  "players.total_games": {
    title: "Total Games",
    formula: "Count of unique games | COUNT(DISTINCT game_id)",
    nativeCurrency: "",
    description: "Total number of games in the Players report.",
  },
  "players.total_sessions": {
    title: "Total Sessions",
    formula: "Count of unique sessions | COUNT(DISTINCT session_id)",
    nativeCurrency: "",
    description: "Total number of sessions in the Players report.",
  },
  "players.total_spins": {
    title: "Total Spins",
    formula: "Count of all spins | COUNT( CASE WHEN round_complete THEN 1 ELSE NULL END)",
    nativeCurrency: "",
    description: "Total number of spins in the Players report.",
  },
  "players.rtp": {
    title: "RTP",
    formula: "Total payouts / Total wagered * 100",
    nativeCurrency: "EUR",
    description:
      "Return to Player percentage calculated from the monetary values displayed in the Players report.",
  },
  "players.avg_bets": {
    title: "AVG Bets",
    formula: "Total wagered / Total bets",
    nativeCurrency: "EUR",
    description:
      "Average bet amount calculated from the monetary values displayed in the Players report.",
  },

  "players.game_id": {
    title: "Game ID",
    formula: "Unique identifier of the game | game_id",
    nativeCurrency: "",
    description: "Unique identifier of the game in the Games report.",
  },
  "players.game_name": {
    title: "Game Name",
    formula: "Name of the game | game_name",
    nativeCurrency: "",
    description: "Name of the game in the Games report.",
  },

  //Games report field helps
  "games.game_id": {
    title: "Game ID",
    formula: "Unique identifier of the game | game_id",
    nativeCurrency: "",
    description: "Unique identifier of the game in the Games report.",
  },
  "games.game_name": {
    title: "Game Name",
    formula: "Name of the game | game_name",
    nativeCurrency: "",
    description: "Name of the game in the Games report.",
  },
  "games.site_id": {
    title: "Site ID",
    formula: "Unique identifier of the site | site_id",
    nativeCurrency: "",
    description: "Unique identifier of the site in the Games report.",
  },
  "games.total_brands": {
    title: "Brands",
    formula: "Count of unique brands | COUNT(DISTINCT brand_id)",
    nativeCurrency: "",
    description: "Total number of brands in the Games report.",
  },
  "games.total_wins_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Games report.",
  },
  "games.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Games report.",
  },
  "games.total_refunds": {
    title: "Total Refunds",
    formula: "Sum of all refunds issued | SUM(refund)",
    nativeCurrency: "EUR",
    description: "Total amount of refunds issued in the Games report.",
  },
  "games.ggr": {
    title: "GGR",
    formula: "Total wagered - Total payouts - Total refunds",
    nativeCurrency: "EUR",
    description:
      "Gross Gaming Revenue calculated from the monetary values displayed in the Games report.",
  },
  "games.rtp": {
    title: "RTP",
    formula: "Total payouts / Total wagered * 100",
    nativeCurrency: "EUR",
    description:
      "Return to Player percentage calculated from the monetary values displayed in the Games report.",
  },
  "games.avg_bets": {
    title: "AVG Bets",
    formula: "Total wagered / Total bets",
    nativeCurrency: "EUR",
    description:
      "Average bet amount calculated from the monetary values displayed in the Games report.",
  },
  "games.total_players": {
    title: "Total Players",
    formula: "Count of unique players | COUNT(DISTINCT operator_player_id)",
    nativeCurrency: "",
    description: "Total number of players in the Games report.",
  },
  "games.total_sessions": {
    title: "Total Sessions",
    formula: "Count of unique sessions | COUNT(DISTINCT session_id)",
    nativeCurrency: "",
    description: "Total number of sessions in the Games report.",
  },
  "games.total_spins": {
    title: "Total Spins",
    formula: "Count of all spins | COUNT( CASE WHEN round_complete THEN 1 ELSE NULL END)",
    nativeCurrency: "",
    description: "Total number of spins in the Games report.",
  },
  "games.studio": {
    title: "Studio",
    formula: "Name of the studio | studio",
    nativeCurrency: "",
    description: "Name of the studio in the Games report.",
  },

  //Sessions report field helps
  "sessions.operator_session_id": {
    title: "Session ID",
    formula: "Unique identifier of the session | operator_session_id",
    nativeCurrency: "",
    description: "Unique identifier of the session in the Sessions report.",
  },
  "sessions.operator_player_id": {
    title: "Player ID",
    formula: "Unique identifier of the player | operator_player_id",
    nativeCurrency: "",
    description: "Unique identifier of the player in the Sessions report.",
  },
  "sessions.brand": {
    title: "Brand",
    formula: "Name of the brand associated with the brand_id field | brand_id",
    nativeCurrency: "EUR",
    description: "Brand associated with the brand_id field in the Sessions report.",
  },
  "sessions.total_wins_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Sessions report.",
  },
  "sessions.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Sessions report.",
  },
  "sessions.rtp": {
    title: "RTP",
    formula: "Total payouts / Total wagered * 100",
    nativeCurrency: "EUR",
    description:
      "Return to Player percentage calculated from the monetary values displayed in the Sessions report.",
  },
  "sessions.total_refunds": {
    title: "Total Refunds",
    formula: "Sum of all refunds issued | SUM(refund)",
    nativeCurrency: "EUR",
    description: "Total amount of refunds issued in the Sessions report.",
  },
  "sessions.ggr": {
    title: "GGR",
    formula: "Total wagered - Total payouts - Total refunds",
    nativeCurrency: "EUR",
    description:
      "Gross Gaming Revenue calculated from the monetary values displayed in the Sessions report.",
  },
  "sessions.total_refunds_count": {
    title: "Total Refunds Count",
    formula: "Count of all refunds issued | COUNT(refund)",
    nativeCurrency: "EUR",
    description: "Total number of refunds issued in the Sessions report.",
  },
  "sessions.total_spins": {
    title: "Total Spins",
    formula: "Count of all spins | COUNT( CASE WHEN round_complete THEN 1 ELSE NULL END)",
    nativeCurrency: "",
    description: "Total number of spins in the Sessions report.",
  },
  "sessions.time_open": {
    title: "Time Open",
    formula: "Timestamp of when the session was opened | time_open",
    nativeCurrency: "",
    description: "Timestamp of when the session was opened in the Sessions report.",
  },
  "sessions.time_closed": {
    title: "Time Closed",
    formula: "Timestamp of when the session was closed | time_closed",
    nativeCurrency: "",
    description: "Timestamp of when the session was closed in the Sessions report.",
  },
  "sessions.game_name": {
    title: "Game Name",
    formula: "Name of the game | game_name",
    nativeCurrency: "",
    description: "Name of the game in the Sessions report.",
  },
  "sessions.client_name": {
    title: "Client Name",
    formula: "Name of the client | client_name",
    nativeCurrency: "",
    description: "Name of the client in the Sessions report.",
  },

  //Rounds report field helps
  "rounds.round_id": {
    title: "Round ID",
    formula: "Unique identifier of the round | round_id",
    nativeCurrency: "",
    description: "Unique identifier of the round in the Rounds report.",
  },
  "rounds.operator_player_id": {
    title: "Player ID",
    formula:
      "Unique identifier of the player associated with the operator_player_id field | operator_player_id",
    nativeCurrency: "",
    description:
      "Unique identifier of the player associated with the operator_player_id field in the Rounds report.",
  },
  "rounds.game": {
    title: "Game Name",
    formula: "Name of the game | game_name",
    nativeCurrency: "",
    description: "Name of the game in the Rounds report.",
  },
  "rounds.studio": {
    title: "Studio",
    formula: "Name of the studio | studio",
    nativeCurrency: "",
    description: "Name of the studio in the Rounds report.",
  },
  "rounds.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Rounds report.",
  },
  "rounds.total_wins_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Rounds report.",
  },
  "rounds.profit": {
    title: "Profit",
    formula: "Sum of all profit amounts |  SUM(stake - returns)",
    nativeCurrency: "EUR",
    description: "Total amount of profit in the Rounds report.",
  },

  //Transactions report field helps
  "transactions.bet_id": {
    title: "Transaction ID",
    formula: "Unique identifier of the transaction | transaction_id",
    nativeCurrency: "",
    description: "Unique identifier of the transaction in the Transactions report.",
  },
  "transactions.round_id": {
    title: "Round ID",
    formula: "Unique identifier of the round | round_id",
    nativeCurrency: "",
    description: "Unique identifier of the round in the Transactions report.",
  },
  "transactions.operator_player_id": {
    title: "Player ID",
    formula:
      "Unique identifier of the player associated with the operator_player_id field | operator_player_id",
    nativeCurrency: "",
    description:
      "Unique identifier of the player associated with the operator_player_id field in the Transactions report.",
  },
  "transactions.game_name": {
    title: "Game Name",
    formula: "Name of the game | game_name",
    nativeCurrency: "",
    description: "Name of the game in the Transactions report.",
  },
  "transactions.operator_session_id": {
    title: "Session ID",
    formula: "Unique identifier of the session | operator_session_id	",
    nativeCurrency: "",
    description: "Unique identifier of the session in the Transactions report.",
  },
  "transactions.studio": {
    title: "Studio",
    formula: "Name of the studio | studio",
    nativeCurrency: "",
    description: "Name of the studio in the Games report.",
  },
  "transactions.balance": {
    title: "Balance (€)",
    formula: "Balance after the transaction | balance",
    nativeCurrency: "EUR",
    description: "Player balance after the transaction in the Transactions report.",
  },
  "transactions.date": {
    title: "Transaction Date",
    formula: "Date of the transaction | date",
    nativeCurrency: "",
    description: "Date of the transaction in the Transactions report.",
  },
  "transactions.currency": {
    title: "Transaction Currency",
    formula: "Currency of the transaction | currency",
    nativeCurrency: "",
    description: "Currency of the transaction in the Transactions report.",
  },
  "transactions.stake": {
    title: "Transaction Stake",
    formula: "Stake of the transaction | stake",
    nativeCurrency: "",
    description: "Stake of the transaction in the Transactions report.",
  },
  "transactions.returns": {
    title: "Transaction Returns",
    formula: "Returns of the transaction | returns",
    nativeCurrency: "",
    description: "Returns of the transaction in the Transactions report.",
  },

  //Invoices report field helps
  "invoices.client_name": {
    title: "Client Name",
    formula: "Name of the client associated with the invoice | client_name",
    nativeCurrency: "",
    description: "Name of the client associated with the invoice in the Invoices report.",
  },
  "invoices.total_wins_amount": {
    title: "Total Win Amount",
    formula: "Sum of all winning amounts |  SUM(returns)",
    nativeCurrency: "EUR",
    description: "Total amount of winnings in the Invoices report.",
  },
  "invoices.total_bets": {
    title: "Total Bets",
    formula: "Sum of all bets placed",
    nativeCurrency: "EUR",
    description: "Total number of bets placed in the Invoices report.",
  },
  "invoices.total_refunds": {
    title: "Total Refunds",
    formula: "Sum of all refunds issued | SUM(refund)",
    nativeCurrency: "EUR",
    description: "Total amount of refunds issued in the Invoices report.",
  },
  "invoices.tax": {
    title: "Tax",
    formula: "Sum of all tax amounts | SUM(tax)",
    nativeCurrency: "EUR",
    description:
      "Tax percentage applied to the invoice GGR. It is calculated by summing the configured tax values for all brands assigned to the operator, then used to derive NGR as GGR minus GGR multiplied by this tax percentage.",
  },
  "invoices.ggr": {
    title: "GGR",
    formula: "Total wagered - Total payouts - Total refunds",
    nativeCurrency: "EUR",
    description:
      "Gross Gaming Revenue calculated from the monetary values displayed in the Invoices report.",
  },
  "invoices.ngr": {
    title: "NGR",
    formula: "GGR - Tax",
    nativeCurrency: "EUR",
    description:
      "Net Gaming Revenue calculated from the monetary values displayed in the Invoices report.",
  },
  "invoices.contract_type": {
    title: "Contract Type",
    formula: "Type of contract associated with the invoice | contract_type",
    nativeCurrency: "",
    description: "Type of contract associated with the invoice in the Invoices report.",
  },
  "invoices.rev_share": {
    title: "Revenue Share",
    formula: "Revenue share percentage | rev_share",
    nativeCurrency: "",
    description:
      "Revenue share configuration for the invoice operator. For Rev. Share contracts, this is the operator rev_share percentage; for Tiers contracts, it is the list of rev_share percentages configured on the operator tiers.",
  },
  "invoices.rev_share_amount": {
    title: "Revenue Share Amount",
    formula: "Calculated revenue share amount from NGR and rev_share percentage | NGR * rev_share",
    nativeCurrency: "EUR",
    description:
      "Revenue share value calculated from the invoice NGR. For Rev. Share contracts, NGR is multiplied by the operator rev_share percentage; for Tiers contracts, NGR is split across the configured tier ranges and each portion is multiplied by that tier's rev_share percentage.",
  },

  //Big Players Report field helps
  "big_players.bet_size": {
    title: "Bet Size",
    formula: "Size of the bet | bet_size",
    nativeCurrency: "EUR",
    description:
      "Size of the bet in the Big Players report. This field filters the amount wagered in a single bet to be greater than the specified value.",
  },
} satisfies Record<string, ReportFieldHelpConfig>;
