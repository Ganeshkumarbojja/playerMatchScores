const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started on port 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDB();

//Get Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    select * from player_details;`;
  const players = await db.all(getPlayersQuery);
  const playerMod = players.map((item) => {
    return {
      playerId: item.player_id,
      playerName: item.player_name,
    };
  });
  response.send(playerMod);
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select * from player_details where
    player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  const playerMod = {
    playerId: player.player_id,
    playerName: player.player_name,
  };
  response.send(playerMod);
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    update player_details
    set player_name='${playerName}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match Details API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    select * from match_details
    where match_id=${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  const matchDetailsMod = {
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  };
  response.send(matchDetailsMod);
});

//Get Player Match Details API

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchDetailsQuery = `
    select match_details.match_id as match_id,
    match_details.match as match, match_details.year as year
    from match_details join player_match_score on 
    match_details.match_id=player_match_score.match_id
    where player_match_score.player_id=${playerId};
    `;
  const playerMatchDetails = await db.all(playerMatchDetailsQuery);
  const playerMatchDetailsMod = playerMatchDetails.map((item) => {
    return {
      matchId: item.match_id,
      match: item.match,
      year: item.year,
    };
  });
  response.send(playerMatchDetailsMod);
});

//Get Players of a match API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    select player_details.player_id,
    player_details.player_name
    from player_details join player_match_score on
    player_details.player_id=player_match_score.player_id
    where player_match_score.match_id=${matchId};`;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  const matchPlayersMod = matchPlayers.map((item) => {
    return {
      playerId: item.player_id,
      playerName: item.player_name,
    };
  });
  response.send(matchPlayersMod);
});

//Statistics of score API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
    select player_details.player_id as playerId,
    player_details.player_name as playerName,
    sum(player_match_score.score) as totalScore,
    sum(player_match_score.fours) as totalFours,
    sum(player_match_score.sixes) as totalSixes
    from
    player_details join player_match_score on
    player_details.player_id=player_match_score.player_id
    group by player_details.player_id
    having playerId=${playerId};`;
  const statistics = await db.get(getStatisticsQuery);
  response.send(statistics);
});

module.exports = app;
