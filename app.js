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
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  //   const matchPlayersMod = matchPlayers.map((item) => {
  //     return {
  //       playerId: item.player_id,
  //       playerName: item.player_name,
  //     };
  //   });
  response.send(matchPlayers);
});

//Statistics of score API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const statistics = await db.get(getPlayerScored);
  response.send(statistics);
});

module.exports = app;
